import { Router } from "express";
import { z } from "zod";
import { resolveIdentity, reverseResolve } from "../services/sns.service.js";
import { computeReputation } from "../services/reputation.service.js";
import {
  validate,
  walletSchema,
  solDomainSchema,
} from "../middleware/validate.js";
import prisma from "../db/prisma.js";
import logger from "../config/logger.js";

const router = Router();

const leaderboardQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

router.get("/explore/leaderboard", validate({ query: leaderboardQuery }), async (req, res, next) => {
  try {
    const { limit, offset } = req.query;

    const sessions = await prisma.session.findMany({
      distinct: ["wallet"],
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: { wallet: true, domain: true },
    });

    const identities = [];

    await Promise.all(
      sessions.map(async (s) => {
        let identity = null;
        if (s.domain) {
          try {
            identity = await resolveIdentity(s.domain);
          } catch (err) {
            logger.warn({ err: err.message, domain: s.domain }, "leaderboard sns failed");
          }
        }
        if (!identity) {
          identity = {
            wallet: s.wallet,
            domain: s.domain || null,
            avatar: null,
            displayName: null,
            bio: null,
            socials: {},
            reputation: null,
            credentials: [],
            resolvedAt: Math.floor(Date.now() / 1000),
          };
        }
        try {
          identity.reputation = await computeReputation(s.wallet);
        } catch (err) {
          logger.warn({ err: err.message, wallet: s.wallet }, "leaderboard rep failed");
        }
        const creds = await prisma.verifiedCredential.findMany({
          where: { wallet: s.wallet },
        });
        identity.credentials = creds.map((c) => ({
          type: c.type,
          threshold: c.threshold,
          verifiedAt: Math.floor(c.verifiedAt.getTime() / 1000),
          txSignature: c.txSig,
          expiresAt: c.expiresAt ? Math.floor(c.expiresAt.getTime() / 1000) : null,
        }));
        identities.push(identity);
      }),
    );

    identities.sort((a, b) => (b.reputation?.total || 0) - (a.reputation?.total || 0));
    res.json({ identities, limit, offset });
  } catch (err) {
    next(err);
  }
});

router.get("/:name", validate({ params: z.object({ name: solDomainSchema }) }), async (req, res, next) => {
  try {
    const identity = await resolveIdentity(req.params.name);
    if (!identity) {
      return res.status(404).json({ error: "Domain not found", code: "DOMAIN_NOT_FOUND" });
    }
    try {
      identity.reputation = await computeReputation(identity.wallet);
    } catch (err) {
      logger.warn({ err: err.message, wallet: identity.wallet }, "reputation failed");
    }
    const creds = await prisma.verifiedCredential.findMany({
      where: { wallet: identity.wallet },
    });
    identity.credentials = creds.map((c) => ({
      type: c.type,
      threshold: c.threshold,
      verifiedAt: Math.floor(c.verifiedAt.getTime() / 1000),
      txSignature: c.txSig,
      expiresAt: c.expiresAt ? Math.floor(c.expiresAt.getTime() / 1000) : null,
    }));
    res.json(identity);
  } catch (err) {
    next(err);
  }
});

router.get(
  "/reverse/:wallet",
  validate({ params: z.object({ wallet: walletSchema }) }),
  async (req, res, next) => {
    try {
      const domain = await reverseResolve(req.params.wallet);
      res.json({ domain });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/age/:wallet",
  validate({ params: z.object({ wallet: walletSchema }) }),
  async (req, res, next) => {
    try {
      const { PublicKey } = await import("@solana/web3.js");
      const { getConnection } = await import("../config/solana.js");
      const conn = getConnection();
      const sigs = await conn.getSignaturesForAddress(new PublicKey(req.params.wallet), {
        limit: 1000,
      });
      const oldest = sigs[sigs.length - 1];
      const firstTxTimestamp = oldest?.blockTime ?? null;
      res.json({
        firstTxTimestamp,
        ageSeconds: firstTxTimestamp ? Math.floor(Date.now() / 1000) - firstTxTimestamp : null,
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
