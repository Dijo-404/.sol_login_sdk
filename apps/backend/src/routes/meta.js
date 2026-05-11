import { Router } from "express";
import { config } from "../config/env.js";

const router = Router();

router.get("/health", async (_req, res) => {
  res.json({ status: "ok", network: config.solanaNetwork });
});

router.get("/version", (_req, res) => {
  res.json({
    name: "sol-login-api",
    version: process.env.npm_package_version || "0.1.0",
    commit: process.env.GIT_COMMIT || null,
    network: config.solanaNetwork,
    programId: config.programId,
  });
});

export default router;
