import { Router } from "express";
import { resolveIdentity, reverseResolve } from "../services/sns.service.js";
import { computeReputation } from "../services/reputation.service.js";
import db from "../db/database.js";

const router = Router();

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
