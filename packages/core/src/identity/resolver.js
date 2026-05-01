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
      } catch {
        // Ignore
      }
    }),
  );

  return records;
}

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
