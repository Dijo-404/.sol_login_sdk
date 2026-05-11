import { config } from "../config/env.js";

const BASES = {
  "mainnet-beta": "https://api.helius.xyz",
  devnet: "https://api-devnet.helius.xyz",
  testnet: "https://api-devnet.helius.xyz",
};

function base() {
  return BASES[config.solanaNetwork] || BASES["mainnet-beta"];
}

async function heliusFetch(path, { params = {}, init = {} } = {}) {
  const url = new URL(`${base()}${path}`);
  url.searchParams.set("api-key", config.heliusApiKey);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Helius ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

export async function fetchTransactions(wallet, { limit = 100, before, source } = {}) {
  return heliusFetch(`/v0/addresses/${wallet}/transactions`, {
    params: { limit, before, source },
  });
}

export async function fetchAllTransactions(wallet, { maxPages = 5, pageSize = 100 } = {}) {
  const all = [];
  let before;
  for (let i = 0; i < maxPages; i++) {
    const page = await fetchTransactions(wallet, { limit: pageSize, before });
    if (!Array.isArray(page) || page.length === 0) break;
    all.push(...page);
    before = page[page.length - 1]?.signature;
    if (!before || page.length < pageSize) break;
  }
  return all;
}
