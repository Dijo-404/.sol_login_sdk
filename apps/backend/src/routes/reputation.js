import { Router } from "express";
import { z } from "zod";
import { computeReputation, invalidateReputation } from "../services/reputation.service.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate, walletSchema } from "../middleware/validate.js";

const router = Router();

router.get(
  "/:wallet",
  validate({ params: z.object({ wallet: walletSchema }) }),
  async (req, res, next) => {
    try {
      res.json(await computeReputation(req.params.wallet));
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/:wallet/refresh",
  authenticate,
  validate({ params: z.object({ wallet: walletSchema }) }),
  async (req, res, next) => {
    try {
      await invalidateReputation(req.params.wallet);
      res.json(await computeReputation(req.params.wallet));
    } catch (err) {
      next(err);
    }
  },
);

export default router;
