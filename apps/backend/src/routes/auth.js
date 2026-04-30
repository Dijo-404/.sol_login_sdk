import { Router } from "express";
import { createChallenge, verifySignature, invalidateSession } from "../services/auth.service.js";
import { resolveIdentity } from "../services/sns.service.js";
import { computeReputation } from "../services/reputation.service.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

// POST /auth/challenge — Issue nonce + message for wallet to sign
router.post("/challenge", (req, res) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) return res.status(400).json({ error: "walletAddress required" });
    const challenge = createChallenge(walletAddress);
    res.json(challenge);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/verify — Verify signature, resolve identity, issue JWT
router.post("/verify", async (req, res) => {
  try {
    const { walletAddress, signature, solDomain } = req.body;
    if (!walletAddress || !signature) {
      return res.status(400).json({ error: "walletAddress and signature required" });
    }

    // Verify Ed25519 signature
    const session = verifySignature(walletAddress, signature, solDomain);

    // Resolve identity from SNS
    let identity = null;
    if (solDomain) {
      identity = await resolveIdentity(solDomain);
    }

    // Build identity object with fallback
    if (!identity) {
      identity = {
        wallet: walletAddress,
        domain: solDomain || null,
        avatar: null,
        displayName: null,
        bio: null,
        socials: {},
        reputation: null,
        credentials: [],
        resolvedAt: Math.floor(Date.now() / 1000),
      };
    }

    // Fetch reputation
    try {
      identity.reputation = await computeReputation(walletAddress);
    } catch { /* reputation is optional */ }

    res.json({ token: session.token, identity });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// GET /auth/me — Return current session identity
router.get("/me", authenticate, async (req, res) => {
  try {
    const { wallet, domain } = req.user;
    let identity = null;
    if (domain) {
      identity = await resolveIdentity(domain);
    }
    if (!identity) {
      identity = { wallet, domain, avatar: null, displayName: null, bio: null, socials: {}, reputation: null, credentials: [], resolvedAt: Math.floor(Date.now() / 1000) };
    }
    try {
      identity.reputation = await computeReputation(wallet);
    } catch { /* optional */ }
    res.json(identity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/logout — Invalidate session
router.post("/logout", authenticate, (req, res) => {
  const token = req.headers.authorization?.slice(7);
  if (token) invalidateSession(token);
  res.json({ success: true });
});

export default router;
