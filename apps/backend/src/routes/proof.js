import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate.js";
import {
  validate,
  proofTypeSchema,
  groth16ProofSchema,
  publicSignalsSchema,
  walletSchema,
} from "../middleware/validate.js";
import { verifyProof, submitCredential } from "../services/zk.service.js";
import prisma from "../db/prisma.js";
import logger from "../config/logger.js";

const router = Router();

const verifyBody = z.object({
  type: proofTypeSchema,
  proof: groth16ProofSchema,
  publicSignals: publicSignalsSchema,
  threshold: z.number().int().nonnegative().optional().nullable(),
});

router.post(
  "/verify",
  authenticate,
  validate({ body: verifyBody }),
  async (req, res, next) => {
    try {
      const { type, proof, publicSignals, threshold } = req.body;
      const wallet = req.user.wallet;

      const verified = await verifyProof({ type, proof, publicSignals });
      if (!verified) {
        return res
          .status(400)
          .json({ error: "Proof failed verification", code: "INVALID_PROOF" });
      }

      const { txSignature, credentialPda, reused } = await submitCredential({
        wallet,
        type,
        proof,
        publicSignals,
      });

      const credential = await prisma.verifiedCredential.create({
        data: {
          wallet,
          type,
          threshold: threshold ?? null,
          txSig: txSignature ?? credentialPda,
          publicSignals,
        },
      });

      logger.info({ wallet, type, txSignature, reused }, "credential issued");

      res.json({
        verified: true,
        txSignature,
        credentialPda,
        reused: !!reused,
        credential: {
          type: credential.type,
          threshold: credential.threshold,
          verifiedAt: Math.floor(credential.verifiedAt.getTime() / 1000),
          txSignature: credential.txSig,
          expiresAt: null,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/:wallet/credentials",
  validate({ params: z.object({ wallet: walletSchema }) }),
  async (req, res, next) => {
    try {
      const rows = await prisma.verifiedCredential.findMany({
        where: { wallet: req.params.wallet },
        orderBy: { verifiedAt: "desc" },
      });
      res.json({
        credentials: rows.map((c) => ({
          type: c.type,
          threshold: c.threshold,
          verifiedAt: Math.floor(c.verifiedAt.getTime() / 1000),
          txSignature: c.txSig,
          expiresAt: c.expiresAt ? Math.floor(c.expiresAt.getTime() / 1000) : null,
        })),
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
