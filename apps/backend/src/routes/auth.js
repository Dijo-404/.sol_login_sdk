import { Router } from "express";
import {
  createChallenge,
  verifySignature,
  invalidateSession,
} from "../services/auth.service.js";
import { resolveIdentity } from "../services/sns.service.js";
import { computeReputation } from "../services/reputation.service.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

router.post("/challenge", (req, res) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress)
      return res.status(400).json({ error: "walletAddress required" });
    const challenge = createChallenge(walletAddress);
    res.json(challenge);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/verify", async (req, res) => {
  try {
    const { walletAddress, signature, solDomain } = req.body;
    if (!walletAddress || !signature) {
      return res
        .status(400)
        .json({ error: "walletAddress and signature required" });
    }

    const session = verifySignature(walletAddress, signature, solDomain);

    let identity = null;
    if (solDomain) {
      identity = await resolveIdentity(solDomain);
    }

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

    try {
      identity.reputation = await computeReputation(walletAddress);
    } catch {
      // Ignore
    }

    res.json({ token: session.token, identity });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

router.get("/me", authenticate, async (req, res) => {
  try {
    const { wallet, domain } = req.user;
    let identity = null;
    if (domain) {
      identity = await resolveIdentity(domain);
    }
    if (!identity) {
      identity = {
        wallet,
        domain,
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
      identity.reputation = await computeReputation(wallet);
    } catch {
      // Ignore
    }
    res.json(identity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/logout", authenticate, (req, res) => {
  const token = req.headers.authorization?.slice(7);
  if (token) invalidateSession(token);
  res.json({ success: true });
});

export default router;
