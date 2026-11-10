import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";

import { setAuthenticationCookie } from "@repo/trpc/server/utils/cookie";

import {
  fleetNodeService,
  userService,
  tokenGenerationService,
} from "@repo/trpc/server/services";

import { logger } from "@repo/logger";

import * as trpcExpress from "@trpc/server/adapters/express";

import {
  generateOpenApiDocument,
  createOpenApiExpressMiddleware,
} from "trpc-to-openapi";

import { apiReference } from "@scalar/express-api-reference";

import {
  serverRouter,
  createContext,
} from "@repo/trpc/server";

import { env } from "./env";
import { createContextFromExpress } from "@repo/trpc/server/context";

// PROMETHEUS IMPORTS
import {
  prometheusRegistry,
  updateFleetNodeMetrics,
} from "./monitoring/prometheus";

const WEB_APP_URL =
  process.env.WEB_APP_URL ?? "https://linuxfleet.its-pratik.dev"

const PROMETHEUS_URL =
  process.env.PROMETHEUS_URL ?? "https://linuxfleet-prometheus.internal.thankfultree-46fa2ae1.uaenorth.azurecontainerapps.io";

const PROMETHEUS_RANGE_SECONDS = 30 * 60;
const PROMETHEUS_STEP_SECONDS = 15;

const ALLOWED_FLEET_METRICS = {
  cpu: "fleet_node_cpu_usage_percent",
  memory: "fleet_node_memory_usage_percent",
  battery: "fleet_node_battery_percent",
  lastReport: "fleet_node_last_report_timestamp_seconds",
} as const;

type FleetMetricKey = keyof typeof ALLOWED_FLEET_METRICS;

export const app = express();

const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "Streamyst OpenAPI",
  version: "1.0.0",
  baseUrl: env.BASE_URL.concat("/api"),
});

// Middleware
// CORS CONFIGURATION
app.use(
  cors({
    origin: WEB_APP_URL,
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// --------------------------------------------------
// PROMETHEUS METRICS
// GET /metrics
// Prometheus scrapes this endpoint.
// --------------------------------------------------

app.get("/metrics", async (_req, res) => {
  try {
    res.setHeader(
      "Content-Type",
      prometheusRegistry.contentType,
    );

    res.end(await prometheusRegistry.metrics());
  } catch (error) {
    logger.error("Failed to expose Prometheus metrics", error);

    res.status(500).send("Failed to collect metrics");
  }
});


app.post("/api/fleet/register", async (req, res) => {
  try {
    const report = req.body;

    if (!report || typeof report !== "object") {
      return res.status(400).json({
        success: false,
        message: "Invalid request body",
      });
    }

    if (
      typeof report.token !== "string" ||
      !report.token.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Registration token is required",
      });
    }

    const { userId } =
      await tokenGenerationService.verifyTokenGenerationForNode(
        report.token,
      );

    const node = report.node;

    if (!node || typeof node !== "object") {
      return res.status(400).json({
        success: false,
        message: "Node information is required",
      });
    }

    const result =
      await fleetNodeService.registerOrUpdateNode(
        userId,
        node,
        true,
      );

    // Update Prometheus metrics after successful registration.
    updateFleetNodeMetrics(userId, node);

    console.log("Linux Fleet node registered:");
    console.log("Node ID:", result.nodeId);

    return res.status(200).json({
      success: true,
      message: "Node registered successfully",
      node_id: result.nodeId,
      node_credential: result.nodeCredential,
      received_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Fleet node registration failed", error);

    return res.status(500).json({
      success: false,
      message: "Node registration failed",
    });
  }
});

// --------------------------------------------------
// CONTINUOUS NODE REPORTING
// POST /api/fleet/report
// --------------------------------------------------

app.post("/api/fleet/report", async (req, res) => {
  try {
    // Read the node credential from Authorization header.
    const authorization = req.headers.authorization;

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Node credential is required",
      });
    }

    const nodeCredential = authorization
      .slice("Bearer ".length)
      .trim();

    if (!nodeCredential) {
      return res.status(401).json({
        success: false,
        message: "Invalid node credential",
      });
    }

    // Verify the credential against the stored hash.
    const authenticatedNode =
      await fleetNodeService.authenticateNodeCredential(
        nodeCredential,
      );

    if (!authenticatedNode) {
      return res.status(401).json({
        success: false,
        message: "Invalid node credential",
      });
    }

    const report = req.body;

    if (!report || typeof report !== "object") {
      return res.status(400).json({
        success: false,
        message: "Invalid report body",
      });
    }

    // Ensure the credential owner matches the reporting node.
    if (report.node_id !== authenticatedNode.nodeId) {
      return res.status(403).json({
        success: false,
        message: "Node ID does not match the credential",
      });
    }

    // Print received metrics in the backend terminal.
    console.log("\n========== FLEET NODE REPORT ==========");
    console.log("Node ID:", report.node_id);
    console.log("Hostname:", report.hostname);
    console.log("OS:", report.os);
    console.log("Kernel:", report.kernel);
    console.log("Architecture:", report.architecture);
    console.log("CPU Cores:", report.cpu_cores);
    console.log("CPU Usage:", report.cpu_usage_percent + "%");
    console.log(
      "RAM:",
      report.memory_used_mb,
      "/",
      report.memory_total_mb,
      "MB",
    );
    console.log(
      "Disk:",
      report.disk_used_mb,
      "/",
      report.disk_total_mb,
      "MB",
    );
    console.log("Battery:", report.battery ?? "Not available");
    console.log("Reported At:", report.reported_at);
    console.log("Received At:", new Date().toISOString());
    console.log("=======================================\n");

    // Update the database for the authenticated node's owner.
    const result =
      await fleetNodeService.registerOrUpdateNode(
        authenticatedNode.userId,
        report,
        false,
      );

    // Update Prometheus metrics after successful database update.
    updateFleetNodeMetrics(
      authenticatedNode.userId,
      report,
    );

    return res.status(200).json({
      success: true,
      message: "Node metrics updated successfully",
      node_id: result.nodeId,
      received_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Fleet node report failed", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process node report",
    });
  }
});

// --------------------------------------------------
// BASIC ROUTES
// --------------------------------------------------

app.get("/", (_req, res) => {
  return res.json({
    message: "Linux Fleet is up and running...",
  });
});

app.get("/health", (_req, res) => {
  return res.json({
    message: "Linux Fleet server is healthy",
    healthy: true,
  });
});

// --------------------------------------------------
// OPENAPI DOCUMENTATION
// --------------------------------------------------

logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);

app.get("/openapi.json", (_req, res) => {
  return res.json(openApiDocument);
});

logger.debug(`docs: ${env.BASE_URL}/docs`);

app.use(
  "/docs",
  apiReference({
    url: "/openapi.json",
  }),
);

// --------------------------------------------------
// OPENAPI / tRPC ROUTES
// --------------------------------------------------

app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

// --------------------------------------------------
// GOOGLE AUTHENTICATION CALLBACK
// --------------------------------------------------

app.get(
  "/authentication/google/callback",
  async (req, res) => {
    try {
      const { code } = req.query;

      if (
        typeof code !== "string" ||
        code.length === 0
      ) {
        return res.redirect(
          `${WEB_APP_URL}/login?error=missing_code`,
        );
      }

      const { token } =
        await userService.handleGoogleOAuthCallback(code);

      const ctx = createContextFromExpress(req, res);

      setAuthenticationCookie(ctx, token);

      return res.redirect(`${WEB_APP_URL}/dashboard`);
    } catch (error) {
      logger.error("Google OAuth callback failed", error);

      return res.redirect(
        `${WEB_APP_URL}/login?error=auth_failed`,
      );
    }
  },
);

// --------------------------------------------------
// tRPC MIDDLEWARE
// --------------------------------------------------

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

export default app;