import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  SOLANA_NETWORK: z.enum(["mainnet-beta", "devnet", "testnet"]).default("devnet"),
  SOLANA_RPC_URL: z.string().url(),

  HELIUS_API_KEY: z.string().min(8, "HELIUS_API_KEY is required for reputation scoring"),

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRY: z.string().default("24h"),

  DATABASE_URL: z.string().url(),

  ALLOWED_ORIGINS: z
    .string()
    .min(1, "ALLOWED_ORIGINS must be a comma-separated list of allowed origins"),

  SOL_LOGIN_PROGRAM_ID: z.string().min(32),
  SOL_LOGIN_SIGNER_KEY: z
    .string()
    .min(1, "SOL_LOGIN_SIGNER_KEY is required (base58-encoded keypair secret)"),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),

  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
  console.error(`\nInvalid environment configuration:\n${issues}\n`);
  console.error("See apps/backend/.env.example for the full list of required variables.\n");
  process.exit(1);
}

const env = parsed.data;

export const config = {
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === "production",
  port: env.PORT,

  solanaNetwork: env.SOLANA_NETWORK,
  solanaRpcUrl: env.SOLANA_RPC_URL,

  heliusApiKey: env.HELIUS_API_KEY,

  jwtSecret: env.JWT_SECRET,
  jwtExpiry: env.JWT_EXPIRY,

  databaseUrl: env.DATABASE_URL,

  allowedOrigins: env.ALLOWED_ORIGINS.split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  programId: env.SOL_LOGIN_PROGRAM_ID,
  signerKey: env.SOL_LOGIN_SIGNER_KEY,

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
  },

  logLevel: env.LOG_LEVEL,
};
