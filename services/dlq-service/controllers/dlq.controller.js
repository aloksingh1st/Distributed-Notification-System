import  prisma  from "../config/db.js";
import getChannel from "../config/connectMQ.js";

/*
   =====================================
   GET /dlq/list
   =====================================
*/
export async function listDlqJobs(req, res) {
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const jobs = await prisma.dlq_messages.findMany({
        where: { status: "FAILED" },
        skip: Number(skip),
        take: Number(limit),
        orderBy: { created_at: "desc" }
    });

    res.json(jobs);
}

/*
   =====================================
   GET /dlq/:id/history
   =====================================
*/
export async function getDlqHistory(req, res) {
    const { id } = req.params;

    // const history = await prisma.dlqHistory.findMany({
    //     where: { jobId: id },
    //     orderBy: { createdAt: "desc" }
    // });

    const history = null; // Placeholder until we implement history tracking

    res.json(history);
}

/*
   =====================================
   POST /dlq/replay
   =====================================
*/export async function replayJobs(req, res) {
    const { ids, rate = 50 } = req.body;

    if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ error: "ids must be an array" });
    }

    const channel = await getChannel();

    const jobs = await prisma.dlq_messages.findMany({
        where: {
            id: { in: ids },
            status: "FAILED"
        }
    });

    let processed = 0;

    for (const job of jobs) {
        try {
            await channel.sendToQueue(
                job.source_queue,
                Buffer.from(JSON.stringify(job.payload)),
                { persistent: true }
            );

            await prisma.dlq_messages.update({
                where: { id: job.id },
                data: {
                    status: "RETRIED",
                    histories: {
                        create: {
                            action: "RETRIED",
                            reason: "Manual replay"
                        }
                    }
                }
            });

            processed++;

            // Rate limiting delay
            if (processed % rate === 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

        } catch (err) {
            console.error("Replay failed for job:", job.id, err);
        }
    }

    res.json({
        success: true,
        replayed: processed
    });
}
/*
   =====================================
   POST /dlq/discard
   =====================================
*/
export async function discardJobs(req, res) {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ error: "ids must be an array" });
    }

    const jobs = await prisma.dlq_messages.findMany({
        where: {
            id: { in: ids },
            status: "PENDING"
        }
    });

    for (const job of jobs) {
        await prisma.dlq_messages.update({
            where: { id: job.id },
            data: {
                status: "DISCARDED",
                histories: {
                    create: {
                        action: "DISCARDED",
                        reason: "Manual discard"
                    }
                }
            }
        });
    }

    res.json({
        success: true,
        discarded: jobs.length
    });
}