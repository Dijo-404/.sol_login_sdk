/**
 * @sol-login/core — SNS Identity Resolver
 * Resolves .sol domains via the Bonfida SNS Protocol on Solana.
 */
import { Connection, PublicKey } from "@solana/web3.js";
import {
  getDomainKeySync,
  NameRegistryState,
  getAllDomains,
  reverseLookup,
  Record,
  getRecordV2,
} from "@bonfida/spl-name-service";

const RPC_ENDPOINTS = {
  devnet: "https://api.devnet.solana.com",
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
};

/**
 * Resolve a .sol domain to a wallet address.
 * @param {string} domain - e.g. "dijo.sol" or "dijo"
 * @param {'devnet'|'mainnet-beta'} network
 * @returns {Promise<string|null>} Base58 wallet address or null
 */
export async function resolveDomain(domain, network = "devnet") {
  const conn = new Connection(RPC_ENDPOINTS[network], "confirmed");
  const clean = domain.replace(/\.sol$/, "");
  try {
    const { pubkey } = getDomainKeySync(clean);
    const { registry } = await NameRegistryState.retrieve(conn, pubkey);
    return registry.owner.toBase58();
  } catch {
    return null;
  }
}

/**
 * Reverse resolve a wallet address to its primary .sol domain.
 * @param {string} walletAddress
 * @param {'devnet'|'mainnet-beta'} network
 * @returns {Promise<string|null>} e.g. "dijo.sol" or null
 */
export async function reverseResolveDomain(walletAddress, network = "devnet") {
  const conn = new Connection(RPC_ENDPOINTS[network], "confirmed");
  try {
    const owner = new PublicKey(walletAddress);
    const domains = await getAllDomains(conn, owner);
    if (!domains.length) return null;
    const name = await reverseLookup(conn, domains[0]);
    return name ? `${name}.sol` : null;
  } catch {
    return null;
  }
}

/**
 * Pull SNS records (avatar, socials) for a domain.
 * @param {string} domain
 * @param {'devnet'|'mainnet-beta'} network
 * @returns {Promise<Object>}
 */
export async function getSnsRecords(domain, network = "devnet") {
  const conn = new Connection(RPC_ENDPOINTS[network], "confirmed");
  const clean = domain.replace(/\.sol$/, "");
  const records = { avatar: null, twitter: null, github: null, discord: null };

  const recordTypes = [
    { key: "avatar", record: Record.Pic },
    { key: "twitter", record: Record.Twitter },
    { key: "github", record: Record.Github },
    { key: "discord", record: Record.Discord },
  ];

  await Promise.allSettled(
    recordTypes.map(async ({ key, record }) => {
      try {
        const res = await getRecordV2(conn, clean, record);
        if (res?.deserializedContent) records[key] = res.deserializedContent;
      } catch { /* record not set */ }
    })
  );

  return records;
}

/**
 * Build a full SolIdentity object from domain + on-chain data.
 * @param {string} domain
 * @param {string} wallet
 * @param {'devnet'|'mainnet-beta'} network
 * @returns {Promise<import('../types.js').SolIdentity>}
 */
export async function buildIdentity(domain, wallet, network = "devnet") {
  const records = await getSnsRecords(domain, network);
  return {
    wallet,
    domain: domain.endsWith(".sol") ? domain : `${domain}.sol`,
    avatar: records.avatar,
    displayName: null,
    bio: null,
    socials: {
      twitter: records.twitter || undefined,
      github: records.github || undefined,
      discord: records.discord || undefined,
    },
    reputation: null,
    credentials: [],
    resolvedAt: Math.floor(Date.now() / 1000),
  };
}
