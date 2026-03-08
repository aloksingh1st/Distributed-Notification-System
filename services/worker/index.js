import express from "express";
import connectMQ from "./utils/connectMQ.js";
import Redis from "ioredis";
import CircuitBreaker from "opossum";

import {
    startRampUp,
    resetRamp,
    pauseRamp,
    resumeRamp,
    applyPrefetch
} from "./utils/adaptivePerfetch.js";

import { register } from "./utils/metrics.js";

import {
    processedCounter,
    failureCounter,
    retryCounter,
    dlqCounter,
    redisLatencyHistogram,
    breakerStateGauge
} from "./utils/metrics.js";
import { setupQueues } from "./utils/queueSetup.js";
import { writeLog } from "./utils/writeLog.js";


writeLog("Worker service booted");

/*
=====================================================
METRICS SERVER
=====================================================
*/

const metricsApp = express();

metricsApp.get("/metrics", async (req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
});

metricsApp.listen(3001, "0.0.0.0", () => {
    console.log("📊 Metrics server running on port 3001");
});
/*
=====================================================
REDIS + CIRCUIT BREAKER
=====================================================
*/

const redis = new Redis("redis://redis:6379");

async function redisCommand(fn) {
    return await fn();
}

const redisBreaker = new CircuitBreaker(redisCommand, {
    timeout: 3000,
    errorThresholdPercentage: 50,
    resetTimeout: 10000
});

let channelRef = null;

/*
Breaker Events
*/

redisBreaker.on("open", () => {
    breakerStateGauge.set(0);
    console.log("🔥 Redis DOWN → circuit OPEN");
    if (channelRef) resetRamp(channelRef);
});

redisBreaker.on("halfOpen", () => {
    breakerStateGauge.set(1);
    console.log("⚠️ Redis HALF-OPEN");
});

redisBreaker.on("close", () => {
    breakerStateGauge.set(2);
    console.log("💚 Redis recovered → circuit CLOSED");
    if (channelRef) startRampUp(channelRef);
});

/*
=====================================================
SAFE REDIS CALL WRAPPER
=====================================================
*/

async function safeRedisCall(fn) {
    const endTimer = redisLatencyHistogram.startTimer();

    const result = await redisBreaker.fire(fn);

    endTimer();

    if (channelRef) {
        const latency = (redisLatencyHistogram.get().values?.slice(-1)[0]?.value) || 0;
        if (latency > 100) pauseRamp(channelRef);
        else resumeRamp(channelRef);
    }

    return result;
}

/*
=====================================================
WORKER
=====================================================
*/

async function startWorker() {
    const channel = await connectMQ();
    channelRef = channel;



    const retryQueues = [
        { name: "notification_retry_1", ttl: 5000 },
        { name: "notification_retry_2", ttl: 30000 },
        { name: "notification_retry_3", ttl: 120000 },
        { name: "notification_retry_4", ttl: 600000 }
    ];


    await setupQueues(channel);
    applyPrefetch(channel);

    console.log("🚀 Worker started");

    channel.consume("notification_queue", async (msg) => {

        // console.log("📥 Received message: " + JSON.stringify(msg));


        if (!msg) {
            console.log("⚠️ Received null message, skipping");
            return;
        }

        try {
            const content = JSON.parse(msg.content.toString());


            const headers = msg.properties.headers || {};
            const retryCount = headers["x-retry-count"] || 0;

            console.log("🔍 Message content:", content, "Retry count:", retryCount);

            const { notificationId: idempotencyKey, msg: text } = content;
            const redisKey = `notification:${idempotencyKey}`;

            console.log("🔍 Message content:", idempotencyKey, text);
            /*
            CIRCUIT BREAKER OPEN → REQUEUE
            */
            if (redisBreaker.isOpen) {
                console.log("⚠️ Circuit breaker OPEN, requeuing message");
                channel.nack(msg, false, true);
                return;
            }

            /*
            IDEMPOTENCY CHECK
            */

            console.log("🔑 Checking idempotency with Redis key:", redisKey);
            const isNew = await safeRedisCall(() =>
                redis.set(redisKey, "processing", "NX", "EX", 3600)
            );

            if (!isNew) {
                channel.ack(msg);
                return;
            }

            console.log("📨 Processing:", text);
            writeLog(`Processing message: ${text}`);

            /*
            SIMULATED FAILURE
            */
            if (Math.random() < 0.7) {
                throw new Error("Simulated failure");
            }

            await safeRedisCall(() =>
                redis.set(redisKey, "done", "EX", 86400)
            );

            processedCounter.inc();

            console.log("Sent Message : " + text);

            writeLog(`Successfully processed message: ${text}`);
            channel.ack(msg);

        } catch (err) {

            failureCounter.inc();

            console.log("❌ Failed:", err.message);

            writeLog(`Failed to process message: ${err.message}`);


            try {
                const content = JSON.parse(msg.content.toString());
                const headers = msg.properties.headers || {};
                const retryCount = headers["x-retry-count"] || 0;
                const redisKey = `notification:${content.notificationId}`;
                const processingError = err;


                console.log("🔍 Handling failure for message:", content, "Retry count:", retryCount);
                /*
                MOVE TO DLQ
                */
                if (retryCount >= retryQueues.length) {
                    dlqCounter.inc();

                    const dlqPayload = {
                        message_id: msg.properties.messageId || null,
                        correlation_id: msg.properties.correlationId || null,

                        source_queue: msg.fields.routingKey || "notification_queue",
                        routing_key: msg.fields.routingKey || null,
                        exchange_name: msg.fields.exchange || null,

                        payload: content, // already parsed earlier
                        headers: msg.properties.headers || {},

                        error_reason: processingError?.message || "Unknown failure",
                        error_stack: processingError?.stack || null,

                        retry_count: retryCount,
                        max_retries: retryQueues.length,
                        failed_at: new Date().toISOString()
                    };

                    channel.sendToQueue(
                        "notification_dlq",
                        Buffer.from(JSON.stringify(dlqPayload)),
                        {
                            persistent: true,
                            contentType: "application/json"
                        }
                    );

                    await safeRedisCall(() => redis.del(redisKey)).catch(() => { });

                    channel.ack(msg);
                    return;
                }

                /*
                RETRY FLOW
                */
                retryCounter.inc();

                const nextQueue = retryQueues[retryCount].name;

                if (typeof nextQueue !== "string" || nextQueue.length === 0) {
                    console.error("Invalid queue name for retry:", nextQueue);
                    channel.nack(msg, false, false); // discard or move to DLQ
                    return;
                }

                channel.sendToQueue(nextQueue, msg.content, {
                    persistent: true,
                    headers: { "x-retry-count": retryCount + 1 }
                });

                await safeRedisCall(() => redis.del(redisKey)).catch(() => { });

                channel.ack(msg);

            } catch (innerErr) {
                console.log("🔥 Critical failure:", innerErr);
                channel.nack(msg, false, true);
            }
        }

    }, { noAck: false });
}

/*
=====================================================
START WORKER
=====================================================
*/

startWorker().catch(err => {
    console.error("💥 Worker crashed:", err);
    process.exit(1);
});