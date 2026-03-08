export async function setupQueues(channel) {
    // MAIN QUEUE
    await channel.assertQueue("notification_queue", {
        durable: true
    });

    // DLQ
    await channel.assertQueue("notification_dlq", {
        durable: true
    });

    const retryConfigs = [
        { name: "notification_retry_1", ttl: 5000 },
        { name: "notification_retry_2", ttl: 30000 },
        { name: "notification_retry_3", ttl: 120000 },
        { name: "notification_retry_4", ttl: 600000 }
    ];

    for (const retry of retryConfigs) {
        await channel.assertQueue(retry.name, {
            durable: true,
            messageTtl: retry.ttl,
            deadLetterExchange: "",
            deadLetterRoutingKey: "notification_queue"
        });
    }
}