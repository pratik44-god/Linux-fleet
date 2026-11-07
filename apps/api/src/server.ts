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
  process.env.WEB_APP_URL ?? "http://localhost:3000";

const PROMETHEUS_URL =
  process.env.PROMETHEUS_URL ?? "http://localhost:9090";

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
if (env.NODE_ENV !== "prod") {
  app.use(
    cors({
      origin: WEB_APP_URL,
      credentials: true,
    }),
  );
}

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

// --------------------------------------------------
// PROMETHEUS HISTORICAL QUERY API
// GET /api/fleet/metrics/range
//
// Query parameters:
//   metric: cpu | memory | battery | lastReport
//   user_id: owner of the fleet nodes
//   start: Unix timestamp in seconds (optional)
//   end: Unix timestamp in seconds (optional)
//   step: query interval in seconds (optional)
//
// This endpoint reads historical samples from Prometheus.
// --------------------------------------------------

// app.get("/api/fleet/metrics/range", async (req, res) => {
//   try {
//     const metricParam = req.query.metric;
//     const userIdParam = req.query.user_id;

//     if (
//       typeof metricParam !== "string" ||
//       !Object.prototype.hasOwnProperty.call(
//         ALLOWED_FLEET_METRICS,
//         metricParam,
//       )
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid metric. Use cpu, memory, battery, or lastReport.",
//       });
//     }

//     if (
//       typeof userIdParam !== "string" ||
//       !userIdParam.trim()
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "user_id is required.",
//       });
//     }

//     const metricKey = metricParam as FleetMetricKey;
//     const metricName = ALLOWED_FLEET_METRICS[metricKey];

//     const nowSeconds = Math.floor(Date.now() / 1000);

//     const parseTimestamp = (
//       value: unknown,
//       fallback: number,
//     ): number => {
//       if (typeof value !== "string" || value.trim() === "") {
//         return fallback;
//       }

//       const parsed = Number(value);

//       return Number.isFinite(parsed) ? parsed : fallback;
//     };

//     const end = parseTimestamp(
//       req.query.end,
//       nowSeconds,
//     );

//     const start = parseTimestamp(
//       req.query.start,
//       end - PROMETHEUS_RANGE_SECONDS,
//     );

//     const requestedStep = parseTimestamp(
//       req.query.step,
//       PROMETHEUS_STEP_SECONDS,
//     );

//     if (start >= end) {
//       return res.status(400).json({
//         success: false,
//         message: "start must be earlier than end.",
//       });
//     }

//     const step = Math.min(
//       Math.max(Math.floor(requestedStep), 5),
//       300,
//     );

//     // Escape the label value before inserting it into PromQL.
//     const escapedUserId = userIdParam
//       .replace(/\\/g, "\\\\")
//       .replace(/"/g, '\\"')
//       .replace(/\n/g, "");

//     const query =
//       `${metricName}{user_id="${escapedUserId}"}`;

//     const prometheusUrl = new URL(
//       "/api/v1/query_range",
//       PROMETHEUS_URL,
//     );

//     prometheusUrl.searchParams.set("query", query);
//     prometheusUrl.searchParams.set("start", String(start));
//     prometheusUrl.searchParams.set("end", String(end));
//     prometheusUrl.searchParams.set("step", String(step));

//     const prometheusResponse = await fetch(
//       prometheusUrl.toString(),
//       {
//         method: "GET",
//         headers: {
//           Accept: "application/json",
//         },
//         signal: AbortSignal.timeout(10_000),
//       },
//     );

//     if (!prometheusResponse.ok) {
//       logger.error(
//         "Prometheus range query failed",
//         {
//           status: prometheusResponse.status,
//           metric: metricKey,
//         },
//       );

//       return res.status(502).json({
//         success: false,
//         message: "Prometheus query failed.",
//       });
//     }

//     const prometheusData =
//       (await prometheusResponse.json()) as {
//         status?: string;
//         error?: string;
//         data?: {
//           resultType?: string;
//           result?: Array<{
//             metric?: Record<string, string>;
//             values?: Array<[number, string]>;
//           }>;
//         };
//       };

//     if (prometheusData.status !== "success") {
//       logger.error(
//         "Prometheus returned an unsuccessful query",
//         prometheusData.error,
//       );

//       return res.status(502).json({
//         success: false,
//         message: "Prometheus returned an unsuccessful query.",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       metric: metricKey,
//       start,
//       end,
//       step,
//       resultType: prometheusData.data?.resultType ?? "matrix",
//       result: prometheusData.data?.result ?? [],
//     });
//   } catch (error) {
//     logger.error(
//       "Failed to retrieve historical fleet metrics",
//       error,
//     );

//     return res.status(500).json({
//       success: false,
//       message: "Failed to retrieve historical fleet metrics.",
//     });
//   }
// });

// --------------------------------------------------
// NODE REGISTRATION
// POST /api/fleet/register
// --------------------------------------------------

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