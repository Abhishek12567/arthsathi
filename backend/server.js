import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

// Initialize app FIRST
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
import transactionRoutes from "./routes/transactions.js";
import agentRoutes from "./routes/agents.js";

// USE ROUTES AFTER app is created
app.use("/api/transactions", transactionRoutes);
app.use("/api/agent", agentRoutes);

// Root route for testing
app.get("/", (req, res) => {
  res.send("Backend is running...");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
