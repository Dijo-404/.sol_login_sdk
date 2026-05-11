import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token", code: "MISSING_TOKEN" });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = payload;
    req.token = token;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token", code: "INVALID_TOKEN" });
  }
}
