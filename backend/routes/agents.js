import express from "express";
import { coach } from "../controllers/agentController.js";
const router = express.Router();
router.post("/coach", coach);
export default router;
