import crypto from "crypto";
import jwt from "jsonwebtoken";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { config } from "../config/env.js";
import { buildChallengeMessage } from "@sol-login/core";
import db from "../db/database.js";

const pendingChallenges = new Map();

export function createChallenge(walletAddress) {
  const nonce = crypto.randomBytes(16).toString("hex");
  const message = buildChallengeMessage({ walletAddress, nonce });

  pendingChallenges.set(walletAddress, {
    nonce,
    message,
    createdAt: Date.now(),
  });

  for (const [key, val] of pendingChallenges) {
    if (Date.now() - val.createdAt > 5 * 60 * 1000)
      pendingChallenges.delete(key);
  }

  return { nonce, message };
}

export function verifySignature(walletAddress, signature, solDomain = null) {
  const challenge = pendingChallenges.get(walletAddress);
  if (!challenge) throw new Error("No pending challenge for this wallet");

  const messageBytes = new TextEncoder().encode(challenge.message);
  const signatureBytes = bs58.decode(signature);
  const publicKeyBytes = bs58.decode(walletAddress);

  const valid = nacl.sign.detached.verify(
    messageBytes,
    signatureBytes,
    publicKeyBytes,
  );
  if (!valid) throw new Error("Invalid signature");

  pendingChallenges.delete(walletAddress);

  const payload = { wallet: walletAddress, domain: solDomain };
  const token = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiry,
  });

  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  db.prepare(
    "INSERT INTO sessions (id, wallet, token, domain, expires_at) VALUES (?, ?, ?, ?, ?)",
  ).run(sessionId, walletAddress, token, solDomain, expiresAt);

  return { token, wallet: walletAddress, domain: solDomain };
}

export function invalidateSession(token) {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}
