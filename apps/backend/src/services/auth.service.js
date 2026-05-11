import crypto from "crypto";
import jwt from "jsonwebtoken";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { PublicKey } from "@solana/web3.js";
import { config } from "../config/env.js";
import { buildChallengeMessage } from "@sol-login/core";
import prisma from "../db/prisma.js";

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const pendingChallenges = new Map();

function assertWallet(address) {
  try {
    new PublicKey(address);
  } catch {
    throw new HttpError(400, "Invalid wallet address");
  }
}

export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function createChallenge(walletAddress) {
  assertWallet(walletAddress);
  const nonce = crypto.randomBytes(16).toString("hex");
  const message = buildChallengeMessage({ walletAddress, nonce });

  pendingChallenges.set(walletAddress, { nonce, message, createdAt: Date.now() });

  const cutoff = Date.now() - CHALLENGE_TTL_MS;
  for (const [key, val] of pendingChallenges) {
    if (val.createdAt < cutoff) pendingChallenges.delete(key);
  }

  return { nonce, message };
}

export async function verifySignature(walletAddress, signature, solDomain = null) {
  assertWallet(walletAddress);

  const challenge = pendingChallenges.get(walletAddress);
  if (!challenge) throw new HttpError(401, "No pending challenge for this wallet");
  if (Date.now() - challenge.createdAt > CHALLENGE_TTL_MS) {
    pendingChallenges.delete(walletAddress);
    throw new HttpError(401, "Challenge expired");
  }

  let signatureBytes;
  try {
    signatureBytes = bs58.decode(signature);
  } catch {
    throw new HttpError(400, "Invalid signature encoding");
  }

  const messageBytes = new TextEncoder().encode(challenge.message);
  const publicKeyBytes = bs58.decode(walletAddress);

  const valid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  if (!valid) throw new HttpError(401, "Invalid signature");

  pendingChallenges.delete(walletAddress);

  const payload = { wallet: walletAddress, domain: solDomain };
  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiry });

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: {
      wallet: walletAddress,
      token,
      domain: solDomain,
      expiresAt,
    },
  });

  return { token, wallet: walletAddress, domain: solDomain };
}

export async function invalidateSession(token) {
  await prisma.session.deleteMany({ where: { token } });
}
