import pino from "pino";
import { config } from "./env.js";

export const logger = pino({
  level: config.logLevel,
  base: { service: "sol-login-api" },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.signerKey",
      "*.jwtSecret",
      "*.heliusApiKey",
    ],
    censor: "[redacted]",
  },
});

export default logger;
