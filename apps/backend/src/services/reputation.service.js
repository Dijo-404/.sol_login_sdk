import { PublicKey } from "@solana/web3.js";
import { getConnection } from "../config/solana.js";
import { REPUTATION_WEIGHTS } from "@sol-login/core";
import { fetchAllTransactions } from "../clients/helius.client.js";
import prisma from "../db/prisma.js";
import logger from "../config/logger.js";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const PROGRAM_IDS = {
  jupiter: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
  marinade: "MarBmsSgKXdrN1egZf5sqe1TMThczhMLJhYK2BBxoaY",
  drift: "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH",
  tensor: "TSWAPaqyCSx2KABk68Shruf4rp7CxcNi8hAsbdwmHbN",
  magicEden: "M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K",
  realms: "GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw",
  sns: "namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX",
};

const PROGRAM_LOOKUP = new Map(
  Object.entries(PROGRAM_IDS).map(([k, v]) => [v, k]),
);

function logScale(count, scale = 50) {
  if (!count) return 0;
  return Math.min(Math.log10(count + 1) / Math.log10(scale + 1), 1);
}

function programsInTx(tx) {
  const programs = new Set();
  const visit = (ix) => {
    if (!ix) return;
    if (ix.programId) programs.add(ix.programId);
    if (Array.isArray(ix.innerInstructions)) {
      for (const inner of ix.innerInstructions) visit(inner);
    }
  };
  if (Array.isArray(tx?.instructions)) tx.instructions.forEach(visit);
  if (Array.isArray(tx?.events)) {
    for (const ev of tx.events) {
      if (ev?.source) programs.add(ev.source);
    }
  }
  return programs;
}

export async function computeReputation(walletAddress) {
  const pubkey = new PublicKey(walletAddress);

  const cached = await prisma.reputationCache.findUnique({
    where: { wallet: walletAddress },
  });
  if (cached && Date.now() - cached.indexedAt.getTime() < CACHE_TTL_MS) {
    return { total: cached.score, breakdown: cached.breakdown };
  }

  const counts = {
    jupiter: 0,
    marinade: 0,
    drift: 0,
    tensor: 0,
    magicEden: 0,
    realms: 0,
    sns: 0,
    total: 0,
  };
  let oldestBlockTime = null;

  try {
    const txs = await fetchAllTransactions(walletAddress, { maxPages: 5 });
    counts.total = txs.length;
    for (const tx of txs) {
      const programs = programsInTx(tx);
      for (const programId of programs) {
        const key = PROGRAM_LOOKUP.get(programId);
        if (key) counts[key] += 1;
      }
      if (tx.timestamp && (oldestBlockTime === null || tx.timestamp < oldestBlockTime)) {
        oldestBlockTime = tx.timestamp;
      }
    }
  } catch (err) {
    logger.warn({ err: err.message, wallet: walletAddress }, "helius fetch failed");
  }

  if (!oldestBlockTime) {
    try {
      const conn = getConnection();
      const sigs = await conn.getSignaturesForAddress(pubkey, { limit: 1000 });
      const oldest = sigs[sigs.length - 1];
      if (oldest?.blockTime) oldestBlockTime = oldest.blockTime;
    } catch (err) {
      logger.warn({ err: err.message, wallet: walletAddress }, "rpc age fetch failed");
    }
  }

  const defi = Math.min(
    logScale(counts.jupiter, 30) * 0.5 +
      logScale(counts.marinade, 10) * 0.25 +
      logScale(counts.drift, 10) * 0.25,
    1,
  );
  const nft = Math.min(
    logScale(counts.tensor, 20) * 0.55 + logScale(counts.magicEden, 20) * 0.45,
    1,
  );
  const governance = Math.min(logScale(counts.realms, 5), 1);
  const socialVerification = counts.sns > 0 ? 1 : 0;

  let domainAge = 0;
  if (oldestBlockTime) {
    const ageMonths = (Date.now() / 1000 - oldestBlockTime) / (30 * 24 * 3600);
    domainAge = Math.min(ageMonths / 36, 1);
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

  await prisma.reputationCache.upsert({
    where: { wallet: walletAddress },
    update: { score: total, breakdown, indexedAt: new Date() },
    create: { wallet: walletAddress, score: total, breakdown },
  });

  return { total, breakdown };
}

export async function invalidateReputation(walletAddress) {
  await prisma.reputationCache.deleteMany({ where: { wallet: walletAddress } });
}
