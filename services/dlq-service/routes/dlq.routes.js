import { Router } from "express";
import {
    listDlqJobs,
    getDlqHistory,
    replayJobs,
    discardJobs
} from "../controllers/dlq.controller.js";

const router = Router();

router.get("/list", listDlqJobs);
router.get("/:id/history", getDlqHistory);
router.post("/replay", replayJobs);
router.post("/discard", discardJobs);

export default router;