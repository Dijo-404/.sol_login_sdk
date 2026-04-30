import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT || "4000"),
  solanaRpcUrl: process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
  solanaNetwork: process.env.SOLANA_NETWORK || "devnet",
  jwtSecret: process.env.JWT_SECRET || "sol-login-dev-secret",
  jwtExpiry: process.env.JWT_EXPIRY || "24h",
};
