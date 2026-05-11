import { config } from "../config/env.js";
import logger from "../config/logger.js";

export function notFoundHandler(_req, res) {
  res.status(404).json({ error: "Not found", code: "NOT_FOUND" });
}

export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const code = err.code || (status >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR");
  const message = status >= 500 ? "Internal server error" : err.message;

  logger.error(
    {
      err: { message: err.message, stack: err.stack, code },
      status,
      path: req.path,
      method: req.method,
      requestId: req.id,
    },
    "request failed",
  );

  const body = { error: message, code };
  if (!config.isProduction && status >= 500) {
    body.message = err.message;
  }
  res.status(status).json(body);
}
