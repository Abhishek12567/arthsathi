// backend/routes/transactions.js
import express from "express";
import { addTransaction, getTransactions } from "../controllers/transactionsController.js";

const router = express.Router();

router.post("/add", addTransaction);
router.get("/:userId", getTransactions);

export default router;
