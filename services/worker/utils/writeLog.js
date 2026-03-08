import fs from "fs";

const LOG_DIR = "/app/logs";
const LOG_FILE = "/app/logs/message.txt";

export function writeLog(message) {
    try {
        // Ensure directory exists
        if (!fs.existsSync(LOG_DIR)) {
            fs.mkdirSync(LOG_DIR, { recursive: true });
        }

        const time = new Date().toISOString();
        const line = `${time} - ${message}\n`;

        fs.appendFileSync(LOG_FILE, line, "utf8");

        console.log("📝 Log written");
    } catch (err) {
        console.error("❌ Log write failed:", err);
    }
}