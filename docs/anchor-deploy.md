# Anchor Program Deployment

The `sol-login` Anchor program ([programs/sol-login](../programs/sol-login)) ships with a placeholder `declare_id!` and must be deployed before the backend can submit credential transactions.

## Prerequisites

- [Solana CLI](https://docs.solanalabs.com/cli/install) `>= 1.18`
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) `>= 0.30`
- A funded keypair on the target cluster

## One-time program keypair

The program ID is derived from a dedicated keypair. Generate it once and keep the file out of source control:

```bash
solana-keygen new --no-bip39-passphrase -o programs/sol-login/keys/sol_login-keypair.json
PROGRAM_ID=$(solana address -k programs/sol-login/keys/sol_login-keypair.json)
echo "Program ID: $PROGRAM_ID"
```

Update [programs/sol-login/src/lib.rs](../programs/sol-login/src/lib.rs) — replace the placeholder in `declare_id!(...)` with `$PROGRAM_ID`.

## Build and deploy

```bash
cd programs/sol-login

# Target devnet (use mainnet-beta only after you've verified everything end-to-end)
solana config set --url devnet
solana airdrop 2

anchor build
anchor deploy \
  --provider.cluster devnet \
  --program-keypair keys/sol_login-keypair.json
```

After a successful deploy, copy the generated IDL into the backend:

```bash
cp target/idl/sol_login.json ../../apps/backend/src/idl/sol_login.json
```

## Issuer (backend signer) keypair

The backend signs credential-issuing transactions on behalf of users. It needs its own funded keypair:

```bash
solana-keygen new --no-bip39-passphrase -o backend-issuer.json
solana airdrop 2 --keypair backend-issuer.json

# Backend expects a base58 secret or a JSON byte array
node -e "console.log(JSON.stringify(require('./backend-issuer.json')))"
```

Set this output as `SOL_LOGIN_SIGNER_KEY` in [apps/backend/.env](../apps/backend/.env.example), and the program ID as `SOL_LOGIN_PROGRAM_ID`.

## Verify

```bash
solana program show $PROGRAM_ID
```

The backend `/proof/verify` route will now submit real transactions to `$PROGRAM_ID`. After a successful proof, look the returned `txSignature` up on https://explorer.solana.com (set the network appropriately).

## Mainnet checklist

- [ ] Re-run the ZK trusted setup with a real multi-party ceremony (see `packages/circuits/scripts/setup.sh`)
- [ ] Fund the issuer keypair on mainnet (`~0.1 SOL` covers thousands of credential PDAs)
- [ ] Switch `SOLANA_NETWORK=mainnet-beta` and `SOLANA_RPC_URL` to a paid RPC
- [ ] Rotate `JWT_SECRET` (≥ 32 chars, random)
- [ ] Restrict `ALLOWED_ORIGINS` to production domains only
- [ ] Consider replacing the off-chain Groth16 verifier with an on-chain alt_bn128 verifier (see TODO in `verify_proof.rs`)
