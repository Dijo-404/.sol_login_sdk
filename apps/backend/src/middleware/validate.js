import { z } from "zod";
import { PublicKey } from "@solana/web3.js";

export const walletSchema = z
  .string()
  .min(32)
  .max(44)
  .refine(
    (v) => {
      try {
        new PublicKey(v);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Invalid Solana wallet address" },
  );

export const solDomainSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9_-]+(\.sol)?$/i, "Invalid .sol domain");

export const proofTypeSchema = z.enum([
  "reputation_threshold",
  "wallet_age",
  "sybil_nullifier",
  "social_ownership",
]);

export const groth16ProofSchema = z.object({
  pi_a: z.array(z.string()).min(2),
  pi_b: z.array(z.array(z.string())).min(2),
  pi_c: z.array(z.string()).min(2),
  protocol: z.string().optional(),
  curve: z.string().optional(),
});

export const publicSignalsSchema = z.array(z.string()).min(1);

export function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) req.query = schemas.query.parse(req.query);
      next();
    } catch (err) {
      if (err?.name === "ZodError") {
        return res.status(400).json({
          error: "Invalid request",
          code: "VALIDATION_ERROR",
          details: err.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        });
      }
      next(err);
    }
  };
}
