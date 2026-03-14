# Distributed Notification System

A scalable, event-driven notification infrastructure built using
**RabbitMQ, Redis, and Node.js**, designed to handle high-throughput
notification workloads reliably.

The system decouples notification ingestion from processing through
asynchronous messaging, enabling fault tolerance, horizontal
scalability, and reliable delivery.

------------------------------------------------------------------------

# Why This System Exists

Modern applications must deliver notifications reliably at scale.\
As traffic increases, synchronous notification processing introduces
several challenges:

• High throughput requirements\
• Message durability guarantees\
• Retry and failure handling\
• Multiple notification channels\
• System observability and monitoring

This project implements a **distributed notification pipeline** that
addresses these challenges using an **event-driven architecture with
worker-based processing**.

------------------------------------------------------------------------

# System Architecture

High-level components:

Client\
↓\
Notify Service (API)\
↓\
Outbox Table (PostgreSQL)\
↓\
Outbox Publisher\
↓\
RabbitMQ Queue\
↓\
Worker Service\
• Notification Processing\
• Retry Queue\
• Dead Letter Queue (DLQ)\
↓\
Redis (Caching + Rate Limiting)

Metrics → Prometheus → Grafana

The system follows the **Outbox Pattern** to guarantee reliable message
publishing and prevent data inconsistency between the database and
message broker.

------------------------------------------------------------------------

# Tech Stack

Backend\
Node.js / Express

Message Broker\
RabbitMQ

Database\
PostgreSQL

Caching / Rate Limiting\
Redis

Monitoring\
Prometheus

Visualization\
Grafana

Containerization\
Docker / Docker Compose

------------------------------------------------------------------------

# Key Features

• Event-driven architecture for asynchronous processing\
• Worker-based notification processing pipeline\
• Reliable event publishing using the **Outbox Pattern**\
• Retry handling with **exponential backoff**\
• Dead Letter Queue (DLQ) for permanent failures\
• Idempotent consumers to handle duplicate messages\
• Redis-based distributed rate limiting\
• Metrics collection with **Prometheus**\
• Monitoring dashboards using **Grafana**\
• Containerized microservices for development and deployment

------------------------------------------------------------------------

# Project Structure

services/
    notify/\
        index.js\
        routes/\
        controllers/\
        config/

    worker/\
        index.js\
        outboxPublisher.js\
        notificationDispatcher.js

    dlq-service/\
        index.js\
        routes/\
        controllers/\
        dlqConsumer/

    docs/\
        architecture.md\
        message-flow.md\
        scaling.md\
        failure-handling.md

------------------------------------------------------------------------

# How to Run the Project

## 1. Clone the repository

git clone `<repository-url>`{=html}\
cd distributed-notification-system

## 2. Start infrastructure

docker compose up

This command launches:

    • RabbitMQ\
    • Redis\
    • PostgreSQL\
    • Worker services\
    • Notification API\
    • Prometheus\
    • Grafana

------------------------------------------------------------------------

# Notification Processing Flow

1.  Client sends a request to the **Notify Service API**.

2.  The service creates a notification entry in the **Outbox Table**.

3.  The **Outbox Publisher** reads pending events and publishes them to
    RabbitMQ.

4.  RabbitMQ distributes messages to available **Worker instances**.

5.  Workers process notifications and attempt delivery.

6.  If processing fails:

    -   The job is requeued with **exponential backoff**.

7.  If a notification fails more than **five retry attempts**:

    -   The message is routed to the **Dead Letter Queue (DLQ)**.

8.  Messages in the DLQ require **manual inspection or retry** via the
    DLQ service dashboard.

9.  Processing metrics are exported to **Prometheus**.

10. **Grafana dashboards** visualize system performance and health.

------------------------------------------------------------------------

# Observability

Prometheus collects system metrics including:

• Queue size\
• Worker processing rate\
• Notification failure counts\
• Retry attempts\
• Processing latency

Grafana dashboards provide real-time insights into system health and
processing throughput.

------------------------------------------------------------------------

# Failure Handling

The system handles failures using multiple reliability mechanisms:

Retry Queue\
    Failed notifications are retried with exponential backoff.

Dead Letter Queue\
    Messages exceeding retry limits are moved to the DLQ for manual
    inspection.

Idempotent Consumers\
    Workers ignore duplicate messages using job state verification.

Circuit Breaker\
    External notification providers are protected with circuit breaker logic
    to prevent cascading failures.

------------------------------------------------------------------------

# Scalability

The system supports horizontal scaling through:

• Multiple worker instances processing messages in parallel\
• RabbitMQ load distribution across consumers\
• Stateless microservices enabling containerized scaling\
• Redis caching reducing database load

Workers can be scaled independently depending on queue workload.

------------------------------------------------------------------------

# Monitoring Dashboard

Grafana dashboards provide insights into:

    • Queue depth\
    • Worker throughput\
    • Failure rates\
    • Notification latency

    Screenshots will be added in future.

------------------------------------------------------------------------

# Documentation

Detailed system documentation is available in the docs directory.

docs/
    architecture.md\
    message-flow.md\
    scaling.md\
    failure-handling.md