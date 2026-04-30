/**
 * @sol-login/core — Auth helpers
 * Challenge message generation and Ed25519 signature utilities.
 */

/**
 * Build the human-readable challenge message for wallet signing.
 * @param {Object} params
 * @param {string} params.walletAddress
 * @param {string} [params.domain]
 * @param {string} params.nonce
 * @param {string} [params.appName]
 * @returns {string}
 */
export function buildChallengeMessage({ walletAddress, domain, nonce, appName = ".sol Login" }) {
  const shortWallet = `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}`;
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

/**
 * Encode a message string to Uint8Array for wallet signing.
 * @param {string} message
 * @returns {Uint8Array}
 */
export function encodeMessage(message) {
  return new TextEncoder().encode(message);
}
