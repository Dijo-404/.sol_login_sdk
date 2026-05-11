import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import crypto from "node:crypto";

import { config } from "./config/env.js";
import logger from "./config/logger.js";
import authRoutes from "./routes/auth.js";
import identityRoutes from "./routes/identity.js";
import reputationRoutes from "./routes/reputation.js";
import proofRoutes from "./routes/proof.js";
import metaRoutes from "./routes/meta.js";
import { authLimiter, proofLimiter, generalLimiter } from "./middleware/rateLimit.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import prisma from "./db/prisma.js";

const app = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.headers["x-request-id"] || crypto.randomUUID(),
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
  }),
);

app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (config.allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "256kb" }));

app.use(generalLimiter);

app.use("/", metaRoutes);
app.use("/auth", authLimiter, authRoutes);
app.use("/identity", identityRoutes);
app.use("/reputation", reputationRoutes);
app.use("/proof", proofLimiter, proofRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(config.port, () => {
  logger.info(
    { port: config.port, network: config.solanaNetwork, rpc: config.solanaRpcUrl },
    "sol-login api listening",
  );
});

async function shutdown(signal) {
  logger.info({ signal }, "shutdown requested");
  server.close(async () => {
    try {
      await prisma.$disconnect();
    } catch (err) {
      logger.error({ err: err.message }, "prisma disconnect failed");
    }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
