# Distributed-Notification-System

A scalable event-driven notification infrastructure built using
RabbitMQ, Redis, and Node.js capable of handling high-throughput
notification workloads.

# why this system exists

Modern applications need to send millions of notifications reliably.

However common problems appear:

• High throughput requirements
• Message durability
• Retry & failure handling
• Multiple notification channels
• Monitoring and observability

This project implements a scalable notification infrastructure
designed to solve these challenges using an event-driven architecture.

System Architecture

Diagram will be here in future

#Tech Stack

Backend: Node.js / Express
Queue: RabbitMQ
Cache / Rate limiting: Redis
Monitoring: Prometheus + Grafana
Containerization: Docker

#Features
✔ Event-driven architecture
✔ Asynchronous processing
✔ Retry & dead letter queues
✔ Worker-based notification processing
✔ Rate limiting
✔ Monitoring with Prometheus
✔ Visualization using Grafana
✔ Dockerized microservices

# Project Structure

services/
    dlq-service/
        config/
        controllers/
        routes/
        dlqConsumer // worker
        index.js //entry point

    notify/
        index.js //exposes api 

    worker/
        outboxPublisher.js //worker
        index.js           //main notification logic dispatcher along with idemptotency and circuit breaker


# How to Run the Project
   1. Clone the repo

git clone <repo>

2. Start infrastructure

docker compose up


# what happens when a notification is sent

    1. Client sends notification request to notify service 
2. notify service create an entry in outbox table
3. outboxPublisher publishes the event to rabbitMQ
4. Queue distributes message to workers
4. Worker processes notification
5. If a notification fails , It goes into retry quese with exponential backoff
6. If the notification fails more than 5 times it goes to dlq and needed manual intervation
7. Notifications in DLQ can be retries by using the dashboard exposed by dlq-service
5. Metrics are exported to Prometheus
6. Grafana dashboards show system health

# observablity 
Prometheus collects metrics like:

• queue size
• worker processing rate
• failure counts
• latency

Grafana dashboards visualize system performance.


screenshots in futer here...


# how system scales.

Horizontal scaling supported through:

• Multiple worker instances
• RabbitMQ load distribution
• Containerized deployment


# Architecture Documentations
  docs/
  architecture.md
  message-flow.md
  scaling.md
  failure-handling.md