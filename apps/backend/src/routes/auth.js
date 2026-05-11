import { Router } from "express";
import { z } from "zod";
import {
  createChallenge,
  verifySignature,
  invalidateSession,
} from "../services/auth.service.js";
import { resolveIdentity } from "../services/sns.service.js";
import { computeReputation } from "../services/reputation.service.js";
import { authenticate } from "../middleware/authenticate.js";
import {
  validate,
  walletSchema,
  solDomainSchema,
} from "../middleware/validate.js";
import logger from "../config/logger.js";

const router = Router();

const challengeBody = z.object({ walletAddress: walletSchema });
const verifyBody = z.object({
  walletAddress: walletSchema,
  signature: z.string().min(64).max(128),
  solDomain: solDomainSchema.optional().nullable(),
});

function emptyIdentity(wallet, domain) {
  return {
    wallet,
    domain: domain || null,
    avatar: null,
    displayName: null,
    bio: null,
    socials: {},
    reputation: null,
    credentials: [],
    resolvedAt: Math.floor(Date.now() / 1000),
  };
}

router.post("/challenge", validate({ body: challengeBody }), (req, res, next) => {
  try {
    res.json(createChallenge(req.body.walletAddress));
  } catch (err) {
    next(err);
  }
});

router.post("/verify", validate({ body: verifyBody }), async (req, res, next) => {
  try {
    const { walletAddress, signature, solDomain } = req.body;
    const session = await verifySignature(walletAddress, signature, solDomain);

    let identity = null;
    if (solDomain) {
      try {
        identity = await resolveIdentity(solDomain);
      } catch (err) {
        logger.warn({ err: err.message, domain: solDomain }, "sns resolve failed");
      }
    }
    if (!identity) identity = emptyIdentity(walletAddress, solDomain);

    try {
      identity.reputation = await computeReputation(walletAddress);
    } catch (err) {
      logger.warn({ err: err.message, wallet: walletAddress }, "reputation failed");
    }

    res.json({ token: session.token, identity });
  } catch (err) {
    next(err);
  }
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const { wallet, domain } = req.user;
    let identity = null;
    if (domain) {
      try {
        identity = await resolveIdentity(domain);
      } catch (err) {
        logger.warn({ err: err.message, domain }, "sns resolve failed");
      }
    }
    if (!identity) identity = emptyIdentity(wallet, domain);
    try {
      identity.reputation = await computeReputation(wallet);
    } catch (err) {
      logger.warn({ err: err.message, wallet }, "reputation failed");
    }
    res.json(identity);
  } catch (err) {
    next(err);
  }
});

router.post("/logout", authenticate, async (req, res, next) => {
  try {
    if (req.token) await invalidateSession(req.token);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
