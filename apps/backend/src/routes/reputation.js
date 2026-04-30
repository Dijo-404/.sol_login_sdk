import { Router } from "express";
import { computeReputation } from "../services/reputation.service.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

// GET /reputation/:wallet — Get reputation score
router.get("/:wallet", async (req, res) => {
  try {
    const score = await computeReputation(req.params.wallet);
    res.json(score);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /reputation/:wallet/refresh — Force re-index
router.post("/:wallet/refresh", authenticate, async (req, res) => {
  try {
    // Clear cache for this wallet
    const db = (await import("../db/database.js")).default;
    db.prepare("DELETE FROM reputation_cache WHERE wallet = ?").run(req.params.wallet);
    const score = await computeReputation(req.params.wallet);
    res.json(score);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
