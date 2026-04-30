import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import crypto from "crypto";
import db from "../db/database.js";

const router = Router();

// POST /proof/verify — Submit a proof for verification
// For hackathon: simulates the on-chain Groth16 verification step
// In production: this calls the Anchor program via RPC
router.post("/verify", authenticate, async (req, res) => {
  try {
    const { type, threshold, proof, publicSignals } = req.body;
    const wallet = req.user.wallet;

    if (!type) return res.status(400).json({ error: "proof type required" });

    // Simulate Groth16 verification delay (in production: call Anchor program)
    await new Promise(r => setTimeout(r, 500));

    // Generate a mock tx signature (in production: actual Solana tx)
    const txSig = `${crypto.randomBytes(32).toString("base64url").slice(0, 44)}`;

    // Store verified credential
    const id = crypto.randomUUID();
    const verifiedAt = new Date().toISOString();
    db.prepare(
      "INSERT INTO verified_credentials (id, wallet, type, threshold, tx_sig, verified_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(id, wallet, type, threshold || null, txSig, verifiedAt);

    const credential = {
      type, threshold: threshold || null,
      verifiedAt: Math.floor(Date.now() / 1000),
      txSignature: txSig, expiresAt: null,
    };

    res.json({ verified: true, txSignature: txSig, credential });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /proof/:wallet/credentials — Get all verified credentials
router.get("/:wallet/credentials", async (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM verified_credentials WHERE wallet = ?").all(req.params.wallet);
    const credentials = rows.map(c => ({
      type: c.type, threshold: c.threshold,
      verifiedAt: new Date(c.verified_at).getTime() / 1000,
      txSignature: c.tx_sig,
      expiresAt: c.expires_at ? new Date(c.expires_at).getTime() / 1000 : null,
    }));
    res.json({ credentials });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
