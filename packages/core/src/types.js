export const REPUTATION_WEIGHTS = {
  defi: 0.3,
  governance: 0.25,
  nft: 0.15,
  domainAge: 0.2,
  socialVerification: 0.1,
};

export const CREDENTIAL_LABELS = {
  wallet_age: { label: "Wallet Age", icon: "Clock" },
  reputation_threshold: { label: "Reputation", icon: "TrendingUp" },
  sybil_nullifier: { label: "Unique Human", icon: "Fingerprint" },
  social_ownership: { label: "Social Verified", icon: "ShieldCheck" },
};

export const WALLETS = [
  { id: "phantom", name: "Phantom", color: "#AB9FF2", initial: "P" },
  { id: "backpack", name: "Backpack", color: "#E33E3F", initial: "B" },
  { id: "solflare", name: "Solflare", color: "#FC9965", initial: "S" },
  { id: "glow", name: "Glow", color: "#7B61FF", initial: "G" },
];

export const FEATURES = [
  {
    title: "One-Tap Auth",
    desc: "Wallet signature + .sol resolution in a single drop-in component. Replace 200 lines of wallet boilerplate.",
    accent: "purple",
    code: `<SolLoginButton onSuccess={onLogin} />`,
  },
  {
    title: "Identity Resolution",
    desc: "Resolve .sol → wallet → linked socials, avatar, bio, and reputation in one composable object.",
    accent: "teal",
    code: `const { identity } = useSolLogin()\nidentity.domain      // "dijo.sol"\nidentity.socials     // { twitter, github, ... }`,
  },
  {
    title: "ZK Credentials",
    desc: "Prove reputation > N, wallet age > N, or unique humanness without revealing the underlying data.",
    accent: "purple",
    code: `await requestProof({\n  type: 'reputation_threshold',\n  threshold: 500,\n})`,
  },
  {
    title: "Reputation Engine",
    desc: "Aggregate Jupiter, Marinade, Drift, Tensor, Realms activity into a 0–1000 score backed by Groth16.",
    accent: "teal",
    code: `useReputation(wallet)\n// → { total: 847, breakdown: {...} }`,
  },
  {
    title: "Sybil Resistance",
    desc: "Per-app nullifiers ensure one .sol = one human. Stop multi-account farming without doxxing users.",
    accent: "accent",
    code: `// nullifier = Poseidon(.sol, secret, appId)`,
  },
  {
    title: "Drop-in Express",
    desc: "Server-side session middleware. Verify .sol identity on protected routes with one line of code.",
    accent: "purple",
    code: `app.get('/protected',\n  verifySolSession(JWT_SECRET),\n  handler)`,
  },
];

export const INTEGRATIONS = [
  { name: "Jupiter", desc: "Swap activity" },
  { name: "Marinade", desc: "Liquid staking" },
  { name: "Drift", desc: "Perp positions" },
  { name: "Tensor", desc: "NFT volume" },
  { name: "Magic Eden", desc: "NFT trades" },
  { name: "Realms", desc: "DAO votes" },
  { name: "SNS", desc: "Identity layer" },
  { name: "Farcaster", desc: "Social graph" },
];
