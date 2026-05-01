import { Router } from "express";
import { resolveIdentity, reverseResolve } from "../services/sns.service.js";
import { computeReputation } from "../services/reputation.service.js";
import db from "../db/database.js";

const router = Router();

// GET /identity/explore/leaderboard — Return all known identities for explore page
// Must be defined BEFORE /:name to avoid route conflict
router.get("/explore/leaderboard", async (req, res) => {
  try {
    // Get all unique wallets that have sessions (i.e. have logged in)
    const sessions = db.prepare(
      "SELECT DISTINCT wallet, domain FROM sessions ORDER BY created_at DESC LIMIT 50"
    ).all();

    const identities = [];

    for (const session of sessions) {
      try {
        let identity = null;

        // Try to resolve via SNS if domain is available
        if (session.domain) {
          try {
            identity = await resolveIdentity(session.domain);
          } catch { /* SNS resolution is best-effort */ }
        }

        // Fallback: build identity from session data
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

        // Attach reputation
        try {
          identity.reputation = await computeReputation(session.wallet);
        } catch { /* optional */ }

        // Attach verified credentials
        const creds = db.prepare(
          "SELECT * FROM verified_credentials WHERE wallet = ?"
        ).all(session.wallet);
        identity.credentials = creds.map(c => ({
          type: c.type,
          threshold: c.threshold,
          verifiedAt: new Date(c.verified_at).getTime() / 1000,
          txSignature: c.tx_sig,
          expiresAt: c.expires_at ? new Date(c.expires_at).getTime() / 1000 : null,
        }));

        identities.push(identity);
      } catch {
        // Skip failed identity resolution
      }
    }

    // Sort by reputation score descending
    identities.sort((a, b) => (b.reputation?.total || 0) - (a.reputation?.total || 0));

    res.json({ identities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /identity/:name — Resolve .sol name → SolIdentity
router.get("/:name", async (req, res) => {
  try {
    const identity = await resolveIdentity(req.params.name);
    if (!identity) return res.status(404).json({ error: "Domain not found" });
    try { identity.reputation = await computeReputation(identity.wallet); } catch {}
    const creds = db.prepare("SELECT * FROM verified_credentials WHERE wallet = ?").all(identity.wallet);
    identity.credentials = creds.map(c => ({
      type: c.type, threshold: c.threshold, verifiedAt: new Date(c.verified_at).getTime() / 1000,
      txSignature: c.tx_sig, expiresAt: c.expires_at ? new Date(c.expires_at).getTime() / 1000 : null,
    }));
    res.json(identity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /identity/reverse/:wallet — Reverse resolve wallet → .sol
router.get("/reverse/:wallet", async (req, res) => {
  try {
    const domain = await reverseResolve(req.params.wallet);
    res.json({ domain });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
