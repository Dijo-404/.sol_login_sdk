import { PrismaClient } from "@prisma/client";
import { config } from "../config/env.js";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log: config.isProduction ? ["error"] : ["warn", "error"],
  });

if (!config.isProduction) globalForPrisma.__prisma = prisma;

export default prisma;
