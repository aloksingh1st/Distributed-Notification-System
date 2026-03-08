import client from 'prom-client';

client.collectDefaultMetrics();



export const prefetchGauge = new client.Gauge({
    name: "worker_prefetch_current",
    help: "Current RabbitMQ prefetch value"
});

export const breakerStateGauge = new client.Gauge({
    name: "redis_breaker_state",
    help: "Circuit breaker state (0=open,1=half,2=closed)"
});

export const rampPausedGauge = new client.Gauge({
    name: "ramp_paused",
    help: "Is ramp paused (1=yes, 0=no)"
});


/*
   =========================
   COUNTERS
   =========================
*/

export const processedCounter = new client.Counter({
    name: "messages_processed_total",
    help: "Total messages processed"
});

export const failureCounter = new client.Counter({
    name: "messages_failed_total",
    help: "Total failures"
});

export const retryCounter = new client.Counter({
    name: "messages_retried_total",
    help: "Total retries"
});

export const dlqCounter = new client.Counter({
    name: "messages_dlq_total",
    help: "Total DLQ moves"
});

/*
   =========================
   HISTOGRAM (LATENCY)
   =========================
*/

export const redisLatencyHistogram = new client.Histogram({
    name: "redis_latency_ms",
    help: "Redis operation latency",
    buckets: [5, 10, 20, 50, 100, 200, 500]
});

/*
   =========================
   EXPORT REGISTRY
   =========================
*/

export const register = client.register;