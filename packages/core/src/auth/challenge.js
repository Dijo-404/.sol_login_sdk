export function buildChallengeMessage({ walletAddress, domain, nonce, appName = ".sol Login" }) {
  const shortWallet = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
  const now = new Date().toISOString();
  return [
    `Sign in to ${appName} with your Solana identity.`,
    "",
    `Wallet: ${shortWallet}`,
    domain ? `.sol Name: ${domain}` : null,
    `Nonce: ${nonce}`,
    `Issued At: ${now}`,
    "",
    "This request will not trigger any blockchain transaction or cost any fees.",
  ].filter(Boolean).join("\n");
}

export function encodeMessage(message) {
  return new TextEncoder().encode(message);
}
