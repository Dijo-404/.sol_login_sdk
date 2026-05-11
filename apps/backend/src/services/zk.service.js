import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { getConnection } from "../config/solana.js";
import { config } from "../config/env.js";
import logger from "../config/logger.js";

const require_ = createRequire(import.meta.url);
const snarkjs = require_("snarkjs");

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROOF_TYPE_INDEX = {
  reputation_threshold: 0,
  wallet_age: 1,
  sybil_nullifier: 2,
  social_ownership: 3,
};

const CIRCUITS_DIR = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "packages",
  "circuits",
  "build",
);

const vkeyCache = new Map();
let _signerKeypair = null;
let _program = null;

function getSignerKeypair() {
  if (_signerKeypair) return _signerKeypair;
  let secret;
  try {
    secret = bs58.decode(config.signerKey);
  } catch {
    try {
      const parsed = JSON.parse(config.signerKey);
      secret = Uint8Array.from(parsed);
    } catch {
      throw new Error("SOL_LOGIN_SIGNER_KEY must be base58 or a JSON byte array");
    }
  }
  _signerKeypair = Keypair.fromSecretKey(secret);
  return _signerKeypair;
}

async function loadVkey(proofType) {
  if (vkeyCache.has(proofType)) return vkeyCache.get(proofType);
  const vkeyPath = path.join(CIRCUITS_DIR, `${proofType}_vkey.json`);
  let raw;
  try {
    raw = await fs.readFile(vkeyPath, "utf8");
  } catch (err) {
    throw new Error(
      `Missing verification key for "${proofType}" at ${vkeyPath}. ` +
        `Run \`pnpm --filter @sol-login/circuits run setup\` to generate it.`,
    );
  }
  const vkey = JSON.parse(raw);
  vkeyCache.set(proofType, vkey);
  return vkey;
}

export async function verifyProof({ type, proof, publicSignals }) {
  if (!(type in PROOF_TYPE_INDEX)) {
    throw Object.assign(new Error(`Unknown proof type: ${type}`), { status: 400 });
  }
  const vkey = await loadVkey(type);
  const ok = await snarkjs.groth16.verify(vkey, publicSignals, proof);
  return ok === true;
}

async function getProgram() {
  if (_program) return _program;

  const idlPath = path.resolve(__dirname, "..", "idl", "sol_login.json");
  let idl;
  try {
    idl = JSON.parse(await fs.readFile(idlPath, "utf8"));
  } catch (err) {
    throw new Error(
      `Missing IDL at ${idlPath}. Run \`anchor build\` in programs/sol-login and copy target/idl/sol_login.json here.`,
    );
  }

  const connection = getConnection();
  const wallet = new anchor.Wallet(getSignerKeypair());
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });

  const programId = new PublicKey(config.programId);
  _program = new anchor.Program(idl, programId, provider);
  return _program;
}

function encodeProofForAnchor(proof, publicSignals) {
  const toBytes = (hexish, len) => {
    const bn = BigInt(hexish.startsWith("0x") ? hexish : `${hexish}`);
    const hex = bn.toString(16).padStart(len * 2, "0");
    return Buffer.from(hex, "hex");
  };
  const proofA = Buffer.concat([toBytes(proof.pi_a[0], 32), toBytes(proof.pi_a[1], 32)]);
  const proofB = Buffer.concat([
    toBytes(proof.pi_b[0][0], 32),
    toBytes(proof.pi_b[0][1], 32),
    toBytes(proof.pi_b[1][0], 32),
    toBytes(proof.pi_b[1][1], 32),
  ]);
  const proofC = Buffer.concat([toBytes(proof.pi_c[0], 32), toBytes(proof.pi_c[1], 32)]);
  const inputs = publicSignals.map((s) => Array.from(toBytes(s, 32)));
  return {
    proofA: Array.from(proofA),
    proofB: Array.from(proofB),
    proofC: Array.from(proofC),
    publicInputs: inputs,
  };
}

export async function submitCredential({ wallet, type, proof, publicSignals }) {
  const program = await getProgram();
  const proofType = PROOF_TYPE_INDEX[type];
  const userPubkey = new PublicKey(wallet);

  const [credentialPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("credential"), userPubkey.toBuffer(), Buffer.from([proofType])],
    program.programId,
  );

  const { proofA, proofB, proofC, publicInputs } = encodeProofForAnchor(proof, publicSignals);

  const signer = getSignerKeypair();

  try {
    const txSig = await program.methods
      .verifyProof(proofA, proofB, proofC, publicInputs, proofType)
      .accounts({
        signer: signer.publicKey,
        user: userPubkey,
        credential: credentialPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    return { txSignature: txSig, credentialPda: credentialPda.toBase58() };
  } catch (err) {
    if (err?.message?.includes("already in use")) {
      logger.info(
        { wallet, type, pda: credentialPda.toBase58() },
        "credential already exists on-chain",
      );
      return { txSignature: null, credentialPda: credentialPda.toBase58(), reused: true };
    }
    throw err;
  }
}
