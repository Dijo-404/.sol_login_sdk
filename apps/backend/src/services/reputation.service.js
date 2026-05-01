import { PublicKey } from "@solana/web3.js";
import { getConnection } from "../config/solana.js";
import { REPUTATION_WEIGHTS } from "@sol-login/core";
import db from "../db/database.js";

export async function computeReputation(walletAddress) {
  const conn = getConnection();
  const pubkey = new PublicKey(walletAddress);

  const cached = db
    .prepare(
      "SELECT * FROM reputation_cache WHERE wallet = ? AND datetime(indexed_at, '+6 hours') > datetime('now')",
    )
    .get(walletAddress);
  if (cached) {
    return { total: cached.score, breakdown: JSON.parse(cached.breakdown) };
  }

  let defi = 0,
    governance = 0,
    nft = 0,
    domainAge = 0,
    socialVerification = 0;

  try {
    const sigs = await conn.getSignaturesForAddress(pubkey, { limit: 100 });
    const txCount = sigs.length;
    defi = Math.min(txCount / 100, 1);

    if (sigs.length > 0) {
      const oldest = sigs[sigs.length - 1];
      if (oldest.blockTime) {
        const ageMonths =
          (Date.now() / 1000 - oldest.blockTime) / (30 * 24 * 3600);
        domainAge = Math.min(ageMonths / 36, 1);
      }
    }

    const balance = await conn.getBalance(pubkey);
    const solBalance = balance / 1e9;
    governance = Math.min(solBalance / 10, 1);
    nft = Math.min(txCount / 50, 1) * 0.7;

    const tokenAccounts = await conn.getParsedTokenAccountsByOwner(pubkey, {
      programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    });
    socialVerification = tokenAccounts.value.length > 0 ? 0.5 : 0;
  } catch (err) {
    console.error("Reputation computation error:", err.message);
  }

  const breakdown = { defi, governance, nft, domainAge, socialVerification };
  const total = Math.min(
    Math.round(
      defi * REPUTATION_WEIGHTS.defi * 1000 +
        governance * REPUTATION_WEIGHTS.governance * 1000 +
        nft * REPUTATION_WEIGHTS.nft * 1000 +
        domainAge * REPUTATION_WEIGHTS.domainAge * 1000 +
        socialVerification * REPUTATION_WEIGHTS.socialVerification * 1000,
    ),
    1000,
  );

  db.prepare(
    "INSERT OR REPLACE INTO reputation_cache (wallet, score, breakdown, indexed_at) VALUES (?, ?, ?, datetime('now'))",
  ).run(walletAddress, total, JSON.stringify(breakdown));

  return { total, breakdown };
}
