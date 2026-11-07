const PROMETHEUS_URL =
  process.env.PROMETHEUS_URL || "http://localhost:9090";

export const dynamic = "force-dynamic";

const METRICS = {
  cpu: "fleet_node_cpu_usage_percent",
  memory: "fleet_node_memory_usage_percent",
  disk: "fleet_node_disk_usage_percent",
  battery: "fleet_node_battery_percent",
} as const;

const RANGES = {
  "15m": 900,
  "1h": 3600,
  "6h": 21600,
  "24h": 86400,
} as const;

type MetricPoint = {
  time: number;
  value: number;
};

type PrometheusResponse = {
  status: string;
  data?: {
    result?: Array<{
      values?: Array<[number, string]>;
    }>;
  };
};

async function queryRange(
  metric: string,
  nodeId: string,
  start: number,
  end: number,
  step: number,
): Promise<MetricPoint[]> {
  const url = new URL("/api/v1/query_range", PROMETHEUS_URL);

  url.searchParams.set("query", `${metric}{node_id="${nodeId}"}`);
  url.searchParams.set("start", String(start));
  url.searchParams.set("end", String(end));
  url.searchParams.set("step", String(step));

  const response = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(
      `Prometheus request failed with status ${response.status}`,
    );
  }

  const result =
    (await response.json()) as PrometheusResponse;

  if (result.status !== "success") {
    throw new Error("Prometheus query was unsuccessful");
  }

  const values = result.data?.result?.[0]?.values ?? [];

  return values
    .map(([timestamp, rawValue]) => ({
      time: Number(timestamp) * 1000,
      value: Number(rawValue),
    }))
    .filter(
      (point) =>
        Number.isFinite(point.time) &&
        Number.isFinite(point.value),
    );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const nodeId = searchParams.get("nodeId");
    const range = searchParams.get("range") || "1h";

    if (!nodeId || !/^[a-zA-Z0-9._:-]+$/.test(nodeId)) {
      return Response.json(
        {
          success: false,
          error: "A valid nodeId is required",
        },
        { status: 400 },
      );
    }

    if (!Object.prototype.hasOwnProperty.call(RANGES, range)) {
      return Response.json(
        {
          success: false,
          error: "Invalid time range",
        },
        { status: 400 },
      );
    }

    const duration = RANGES[range as keyof typeof RANGES];

    const end = Math.floor(Date.now() / 1000);
    const start = end - duration;

    const step = Math.max(
      15,
      Math.floor(duration / 100),
    );

    const [cpu, memory, disk, battery] = await Promise.all([
      queryRange(METRICS.cpu, nodeId, start, end, step),
      queryRange(METRICS.memory, nodeId, start, end, step),
      queryRange(METRICS.disk, nodeId, start, end, step),
      queryRange(METRICS.battery, nodeId, start, end, step),
    ]);

    return Response.json({
      success: true,
      nodeId,
      range,
      data: {
        cpu,
        memory,
        disk,
        battery,
      },
    });
  } catch (error) {
    console.error("Monitoring Prometheus API error:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to fetch monitoring metrics",
      },
      { status: 502 },
    );
  }
}