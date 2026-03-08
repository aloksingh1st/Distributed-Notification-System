import express from "express";
import { randomUUID } from "crypto";
import db from "./utils/db.js";


const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.post("/notify", async (req, res) => {
    const { msg } = req.body;

    if (!msg) {
        return res.status(400).send("msg is required");
    }

    const notificationId = randomUUID();
    const eventId = randomUUID();

    try {
        await db.$transaction(async (tx) => {
            await tx.$executeRaw`
                INSERT INTO notifications(id, message)
                VALUES (${notificationId}, ${msg})
            `;

            await tx.$executeRaw`
  INSERT INTO outbox_events(
    id,
    "idempotencyKey",
    event_type,
    payload
  )
  VALUES (
    ${eventId},
    ${notificationId},
    'NOTIFICATION_CREATED',
    ${JSON.stringify({ notificationId, msg })}
  )
`;
        });

        res.send({ success: true });

    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.listen(3000, () => {
    console.log("Notify service is running on port 4000");
});
