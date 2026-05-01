/**
 * @sol-login/core — SolLoginClient
 * Framework-agnostic client for interacting with the .sol Login backend API.
 */

export class SolLoginClient {
  /**
   * @param {Object} config
   * @param {string} config.apiUrl - Backend API base URL
   * @param {'devnet'|'mainnet-beta'} [config.network='devnet']
   * @param {string} [config.circuitsPath='/circuits']
   */
  constructor({ apiUrl, network = "devnet", circuitsPath = "/circuits" }) {
    this.apiUrl = apiUrl.replace(/\/$/, "");
    this.network = network;
    this.circuitsPath = circuitsPath;
    this._token = null;
  }

  get token() { return this._token; }
  set token(t) { this._token = t; }

  _headers() {
    const h = { "Content-Type": "application/json" };
    if (this._token) h["Authorization"] = `Bearer ${this._token}`;
    return h;
  }

  async _fetch(path, opts = {}) {
    const res = await fetch(`${this.apiUrl}${path}`, {
      ...opts,
      headers: { ...this._headers(), ...opts.headers },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `API error ${res.status}`);
    }
    return res.json();
  }

  // --- Auth ---

  /** Request a challenge nonce for wallet signature */
  async getChallenge(walletAddress) {
    return this._fetch("/auth/challenge", {
      method: "POST",
      body: JSON.stringify({ walletAddress }),
    });
  }

  /** Verify a signed challenge and receive JWT + identity */
  async verify(walletAddress, signature, solDomain = null) {
    const data = await this._fetch("/auth/verify", {
      method: "POST",
      body: JSON.stringify({ walletAddress, signature, solDomain }),
    });
    this._token = data.token;
    return data;
  }

  /** Get current session identity */
  async me() {
    return this._fetch("/auth/me");
  }

  /** Logout and invalidate session */
  async logout() {
    await this._fetch("/auth/logout", { method: "POST" });
    this._token = null;
  }

  // --- Identity ---

  /** Resolve a .sol name to a full SolIdentity */
  async resolveIdentity(name) {
    return this._fetch(`/identity/${encodeURIComponent(name)}`);
  }

  /** Reverse resolve a wallet address to .sol name */
  async reverseResolve(wallet) {
    return this._fetch(`/identity/reverse/${wallet}`);
  }

  // --- Reputation ---

  /** Get reputation score for a wallet */
  async getReputation(wallet) {
    return this._fetch(`/reputation/${wallet}`);
  }

  /** Trigger reputation re-index */
  async refreshReputation(wallet) {
    return this._fetch(`/reputation/${wallet}/refresh`, { method: "POST" });
  }

  // --- ZK Proofs ---

  /** Submit a proof for on-chain verification */
  async verifyProof({ type, threshold, proof, publicSignals }) {
    return this._fetch("/proof/verify", {
      method: "POST",
      body: JSON.stringify({ type, threshold, proof, publicSignals }),
    });
  }

  /** Get all verified credentials for a wallet */
  async getCredentials(wallet) {
    return this._fetch(`/proof/${wallet}/credentials`);
  }

  // --- Explore ---

  /** Get all known identities for the explore leaderboard */
  async getLeaderboard() {
    return this._fetch("/identity/explore/leaderboard");
  }
}
