import * as snarkjs from "snarkjs";

const ARTIFACTS_BASE = "/circuits";

const ARTIFACTS = {
  reputation_threshold: {
    wasm: `${ARTIFACTS_BASE}/reputation_threshold.wasm`,
    zkey: `${ARTIFACTS_BASE}/reputation_threshold_final.zkey`,
  },
  wallet_age: {
    wasm: `${ARTIFACTS_BASE}/wallet_age.wasm`,
    zkey: `${ARTIFACTS_BASE}/wallet_age_final.zkey`,
  },
  sybil_nullifier: {
    wasm: `${ARTIFACTS_BASE}/sybil_nullifier.wasm`,
    zkey: `${ARTIFACTS_BASE}/sybil_nullifier_final.zkey`,
  },
  social_ownership: {
    wasm: `${ARTIFACTS_BASE}/social_ownership.wasm`,
    zkey: `${ARTIFACTS_BASE}/social_ownership_final.zkey`,
  },
};

async function assertArtifact(url) {
  const res = await fetch(url, { method: "HEAD" });
  if (!res.ok) {
    throw new Error(
      `Circuit artifact missing at ${url}. Run \`pnpm --filter @sol-login/circuits run setup\` then re-run \`pnpm dev\`.`,
    );
  }
}

export async function generateProof({ type, inputs, onPhase }) {
  const artifacts = ARTIFACTS[type];
  if (!artifacts) throw new Error(`Unknown proof type: ${type}`);

  onPhase?.("load");
  await Promise.all([assertArtifact(artifacts.wasm), assertArtifact(artifacts.zkey)]);

  onPhase?.("witness");
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    inputs,
    artifacts.wasm,
    artifacts.zkey,
  );

  onPhase?.("done");
  return { proof, publicSignals };
}
