import connectMQ from "./utils/connectMQ.js";
import db from "./utils/db.js";

const QUEUE = "notification_queue";

async function startWorker() {
    console.log("📦 Outbox worker started");

    const channel = await connectMQ();

    while (true) {
        try {
            const events = await db.$queryRaw`
        SELECT * FROM outbox_events
        WHERE status = 'PENDING'
        ORDER BY created_at
        LIMIT 50
        FOR UPDATE SKIP LOCKED
      `;

            for (const event of events) {

                console.log(`📤 Sending event ${event.payload} to queue`);
                try {
                    channel.sendToQueue(
                        QUEUE,
                        Buffer.from(JSON.stringify(event.payload)),
                        { persistent: true }
                    );

                    await db.$executeRaw`
            UPDATE outbox_events
            SET status='SENT'
            WHERE id=${event.id}
          `;

                } catch (err) {
                    await db.$executeRaw`
            UPDATE outbox_events
            SET retry_count = retry_count + 1,
                last_error = ${err.message}
            WHERE id=${event.id}
          `;
                }
            }

        } catch (err) {
            console.error("Outbox worker error:", err);
        }

        await new Promise(r => setTimeout(r, 3000));
    }
}

startWorker().catch(err => {
    console.error("💥 Worker crashed:", err);
    process.exit(1);
});