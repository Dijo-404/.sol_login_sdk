import { resolveDomain, reverseResolveDomain, buildIdentity } from "@sol-login/core";
import { config } from "../config/env.js";

export async function resolveIdentity(name) {
  const clean = name.replace(/\.sol$/, "");
  const wallet = await resolveDomain(clean, config.solanaNetwork);
  if (!wallet) return null;
  return buildIdentity(clean, wallet, config.solanaNetwork);
}

export async function reverseResolve(walletAddress) {
  return reverseResolveDomain(walletAddress, config.solanaNetwork);
}
