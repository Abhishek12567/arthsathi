import express from "express";
import { getNudges, addNudge } from "../controllers/nudgesController.js";

const router = express.Router();

router.get("/:userId", getNudges);
router.post("/add", addNudge);

export default router;
