export class SolLoginClient {
  constructor({ apiUrl, network = "devnet", circuitsPath = "/circuits" }) {
    this.apiUrl = apiUrl.replace(/\/$/, "");
    this.network = network;
    this.circuitsPath = circuitsPath;
    this._token = null;
  }

  get token() {
    return this._token;
  }
  set token(t) {
    this._token = t;
  }

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

  async getChallenge(walletAddress) {
    return this._fetch("/auth/challenge", {
      method: "POST",
      body: JSON.stringify({ walletAddress }),
    });
  }

  async verify(walletAddress, signature, solDomain = null) {
    const data = await this._fetch("/auth/verify", {
      method: "POST",
      body: JSON.stringify({ walletAddress, signature, solDomain }),
    });
    this._token = data.token;
    return data;
  }

  async me() {
    return this._fetch("/auth/me");
  }

  async logout() {
    await this._fetch("/auth/logout", { method: "POST" });
    this._token = null;
  }

  async resolveIdentity(name) {
    return this._fetch(`/identity/${encodeURIComponent(name)}`);
  }

  async reverseResolve(wallet) {
    return this._fetch(`/identity/reverse/${wallet}`);
  }

  async getReputation(wallet) {
    return this._fetch(`/reputation/${wallet}`);
  }

  async refreshReputation(wallet) {
    return this._fetch(`/reputation/${wallet}/refresh`, { method: "POST" });
  }

  async verifyProof({ type, threshold, proof, publicSignals }) {
    return this._fetch("/proof/verify", {
      method: "POST",
      body: JSON.stringify({ type, threshold, proof, publicSignals }),
    });
  }

  async getCredentials(wallet) {
    return this._fetch(`/proof/${wallet}/credentials`);
  }

  async getLeaderboard() {
    return this._fetch("/identity/explore/leaderboard");
  }
}
