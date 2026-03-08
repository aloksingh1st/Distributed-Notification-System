import connectMq from './config/connectMQ.js';
import prisma from './config/db.js';


const models = Object.keys(prisma).filter(
    (key) => typeof prisma[key] === 'object' && !key.startsWith('$')
);

console.log("Available models:", models);


const DLQ_QUEUE_NAME = "notification_dlq";

export async function consumeDLQ() {
    const channel = await connectMq();

    await channel.assertQueue(DLQ_QUEUE_NAME, { durable: true });
    console.log(`Waiting for messages in ${DLQ_QUEUE_NAME}...`);

    channel.consume(DLQ_QUEUE_NAME, async (msg) => {
        if (!msg) return;

        try {
            const data = JSON.parse(msg.content.toString());

            const {
                source_queue,
                routing_key,
                payload,
                error,
                stack,
                retry_count,
                max_retries,
                failed_at,
            } = data;


          

            const job = await prisma.dlq_messages.create({
                data: {
                    source_queue: source_queue,
                    routing_key: routing_key,
                    payload,
                    message_id: payload.notificationId || '1234',
                    error_reason: error,
                    error_stack: stack,
                    retry_count : retry_count || 0,
                    max_retries : max_retries || 3,
                    last_failed_at: failed_at ? new Date(failed_at) : new Date(),
                    updated_at: new Date()
                }
            });

            console.log("📥 Stored DLQ Job:", job.id);

            channel.ack(msg);

        } catch (err) {
            console.error("❌ DLQ Consumer Error:", err);
            channel.nack(msg, false, true);
        }
    }, { noAck: false });

}