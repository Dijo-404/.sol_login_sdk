import express from "express";
import cors from "cors";
import { config } from "./config/env.js";
import authRoutes from "./routes/auth.js";
import identityRoutes from "./routes/identity.js";
import reputationRoutes from "./routes/reputation.js";
import proofRoutes from "./routes/proof.js";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health check
app.get("/health", (_, res) => res.json({ status: "ok", network: config.solanaNetwork }));

// API routes
app.use("/auth", authRoutes);
app.use("/identity", identityRoutes);
app.use("/reputation", reputationRoutes);
app.use("/proof", proofRoutes);

app.listen(config.port, () => {
  console.log(`\n  .sol Login API running on http://localhost:${config.port}`);
  console.log(`  Network: ${config.solanaNetwork}`);
  console.log(`  RPC: ${config.solanaRpcUrl}\n`);
});
