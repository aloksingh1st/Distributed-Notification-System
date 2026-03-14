# Message Flow

## Overview

The Distributed Notification System processes notifications asynchronously using an event-driven pipeline. This approach separates request ingestion from notification processing, improving reliability and system scalability.

The following sections describe the lifecycle of a notification request from ingestion to completion.

---

## Step 1 — Client Request

A client sends a notification request to the **Notify Service API**.

Example request:

POST /notify

The request contains:

- Notification type (email, SMS, push, etc.)
- Recipient information
- Notification payload
- Metadata

The API validates the request before storing it.

---

## Step 2 — Notification Persistence

The Notify Service writes the notification request to the **database** and creates an entry in the **Outbox Table**.

Database operations occur in a single transaction to ensure consistency.

Stored data includes:

- Job ID
- Notification type
- Payload
- Status
- Retry count
- Timestamp

The job ID is returned to the client.

---

## Step 3 — Outbox Event Publishing

The **Outbox Publisher** continuously polls the Outbox Table for unprocessed events.

For each new entry:

1. The event is read from the table
2. A message is constructed
3. The message is published to RabbitMQ
4. The event is marked as processed

This pattern ensures reliable message delivery even if services crash during processing.

---

## Step 4 — Queue Distribution

RabbitMQ receives the event and places it in the **notification queue**.

Responsibilities of the queue:

- Store messages reliably
- Distribute messages to worker instances
- Enable retry and dead-letter routing

RabbitMQ ensures load balancing across worker instances.

---

## Step 5 — Worker Consumption

Worker services subscribe to the queue and consume notification messages.

Each worker performs:

1. Message validation
2. Idempotency check
3. Notification dispatch

Workers process notifications independently, allowing horizontal scaling.

---

## Step 6 — Notification Dispatch

The worker sends the notification using a dispatcher module.

Examples:

- Email provider
- SMS gateway
- Push notification service

Circuit breaker logic protects the system if the external provider becomes unavailable.

---

## Step 7 — Retry Handling

If a notification fails:

1. The worker increments the retry count
2. The message is requeued with exponential backoff
3. Processing is attempted again later

This handles temporary failures such as:

- Network issues
- Provider downtime
- API rate limits

---

## Step 8 — Dead Letter Queue

If the retry limit is exceeded:

- The message is moved to the **Dead Letter Queue (DLQ)**

Messages in the DLQ require manual inspection or controlled retries through the DLQ service.

---

## Step 9 — Metrics Collection

Throughout the pipeline, metrics are collected including:

- Queue length
- Worker throughput
- Processing latency
- Retry attempts
- Failure counts

These metrics are exported to **Prometheus**.

---

## Step 10 — Monitoring

Prometheus collects metrics and sends them to **Grafana dashboards** for visualization.

Operators can monitor:

- Notification throughput
- Failure rates
- Queue backlog
- System latency

---

## Summary

The message flow ensures that notification processing is:

- Asynchronous
- Reliable
- Scalable
- Observable

This architecture allows the system to handle large volumes of notifications without blocking client requests.