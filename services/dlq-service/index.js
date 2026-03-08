import { consumeDLQ } from "./dlqConsumer.js";
import dlqRoutes from "./routes/dlq.routes.js";


import path from "path";
import { fileURLToPath } from "url";

import express from "express";
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "./public")));

app.use(express.json());
app.use("/dlq", dlqRoutes);


const port = process.env.PORT || 3008;


async function startDLQService() {
    try {
        await consumeDLQ();

        app.listen(port, () => {
            console.log(`DLQ Service is running on port ${port}`);
        });
    }
    catch (err) {
        console.error(" DLQ Service Error:", err);
        process.exit(1);
    }
}

startDLQService();