import { buildPoseidon } from "circomlibjs";

let _poseidon = null;
async function poseidon() {
  if (!_poseidon) _poseidon = await buildPoseidon();
  return _poseidon;
}

function randomSalt() {
  const buf = new Uint8Array(31);
  crypto.getRandomValues(buf);
  let hex = "0x";
  for (const b of buf) hex += b.toString(16).padStart(2, "0");
  return BigInt(hex).toString();
}

function bytesToFieldString(bytes) {
  let hex = "0x";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return (BigInt(hex) % (2n ** 252n)).toString();
}

async function hashStringToField(input) {
  const enc = new TextEncoder().encode(input);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", enc));
  return bytesToFieldString(digest);
}

async function poseidonField(inputs) {
  const p = await poseidon();
  const out = p(inputs.map((x) => BigInt(x)));
  return p.F.toString(out);
}

export async function buildInputs({ type, request, client, identity }) {
  switch (type) {
    case "reputation_threshold": {
      const rep = identity?.reputation || (await client.getReputation(identity.wallet));
      const score = rep?.total ?? 0;
      const threshold = request.threshold ?? 500;
      if (score < threshold) {
        throw new Error(
          `Your reputation (${score}) is below the requested threshold (${threshold}).`,
        );
      }
      const salt = randomSalt();
      const commitment = await poseidonField([score, salt]);
      return {
        inputs: {
          reputationScore: String(score),
          salt,
          threshold: String(threshold),
          commitment,
        },
        publicHints: { threshold, commitment },
      };
    }

    case "wallet_age": {
      const minMonths = request.threshold ?? 6;
      const minAgeSeconds = String(minMonths * 30 * 24 * 3600);
      const { firstTxTimestamp } = await client.getWalletAge(identity.wallet);
      if (firstTxTimestamp === null) {
        throw new Error("No transaction history found for this wallet.");
      }
      const now = Math.floor(Date.now() / 1000);
      if (now - firstTxTimestamp < minMonths * 30 * 24 * 3600) {
        throw new Error(`Wallet is younger than the requested ${minMonths} months.`);
      }
      const salt = randomSalt();
      const commitment = await poseidonField([firstTxTimestamp, salt]);
      return {
        inputs: {
          firstTxTimestamp: String(firstTxTimestamp),
          salt,
          minAgeSeconds,
          currentTimestamp: String(now),
          commitment,
        },
        publicHints: { minAgeSeconds, currentTimestamp: now, commitment },
      };
    }

    case "sybil_nullifier": {
      const appId = request.appId ?? "1";
      const domain = identity?.domain || identity?.wallet || "anonymous";
      const solDomainHash = await hashStringToField(domain);
      const storageKey = `sol-login:sybil-secret:${identity.wallet}`;
      let userSecret = localStorage.getItem(storageKey);
      if (!userSecret) {
        userSecret = randomSalt();
        localStorage.setItem(storageKey, userSecret);
      }
      return {
        inputs: { solDomainHash, userSecret, appId: String(appId) },
        publicHints: { appId },
      };
    }

    case "social_ownership": {
      const handle = request.socialHandle;
      const platformId = request.platformId ?? "1";
      if (!handle) throw new Error("socialHandle is required for social_ownership proof.");
      const socialHandleHash = await hashStringToField(handle);
      const walletHash = await hashStringToField(identity.wallet);
      const salt = randomSalt();
      const socialCommitment = await poseidonField([
        socialHandleHash,
        walletHash,
        salt,
        platformId,
      ]);
      return {
        inputs: {
          socialHandleHash,
          walletHash,
          salt,
          platformId: String(platformId),
          socialCommitment,
        },
        publicHints: { socialCommitment, platformId },
      };
    }

    default:
      throw new Error(`Unsupported proof type: ${type}`);
  }
}
