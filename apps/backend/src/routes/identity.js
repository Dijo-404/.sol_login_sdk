import { Router } from "express";
import { resolveIdentity, reverseResolve } from "../services/sns.service.js";
import { computeReputation } from "../services/reputation.service.js";
import db from "../db/database.js";

const router = Router();

router.get("/explore/leaderboard", async (req, res) => {
  try {
    const sessions = db
      .prepare(
        "SELECT DISTINCT wallet, domain FROM sessions ORDER BY created_at DESC LIMIT 50",
      )
      .all();

    const identities = [];

    for (const session of sessions) {
      try {
        let identity = null;

        if (session.domain) {
          try {
            identity = await resolveIdentity(session.domain);
          } catch {
            // Ignore
          }
        }

        if (!identity) {
          identity = {
            wallet: session.wallet,
            domain: session.domain || null,
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
          identity.reputation = await computeReputation(session.wallet);
        } catch {
          // Ignore
        }

        const creds = db
          .prepare("SELECT * FROM verified_credentials WHERE wallet = ?")
          .all(session.wallet);
        identity.credentials = creds.map((c) => ({
          type: c.type,
          threshold: c.threshold,
          verifiedAt: new Date(c.verified_at).getTime() / 1000,
          txSignature: c.tx_sig,
          expiresAt: c.expires_at
            ? new Date(c.expires_at).getTime() / 1000
            : null,
        }));

        identities.push(identity);
      } catch {
        // Ignore
      }
    }

    identities.sort(
      (a, b) => (b.reputation?.total || 0) - (a.reputation?.total || 0),
    );
    res.json({ identities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:name", async (req, res) => {
  try {
    const identity = await resolveIdentity(req.params.name);
    if (!identity) return res.status(404).json({ error: "Domain not found" });
    try {
      identity.reputation = await computeReputation(identity.wallet);
    } catch {
      // Ignore
    }
    const creds = db
      .prepare("SELECT * FROM verified_credentials WHERE wallet = ?")
      .all(identity.wallet);
    identity.credentials = creds.map((c) => ({
      type: c.type,
      threshold: c.threshold,
      verifiedAt: new Date(c.verified_at).getTime() / 1000,
      txSignature: c.tx_sig,
      expiresAt: c.expires_at ? new Date(c.expires_at).getTime() / 1000 : null,
    }));
    res.json(identity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/reverse/:wallet", async (req, res) => {
  try {
    const domain = await reverseResolve(req.params.wallet);
    res.json({ domain });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
