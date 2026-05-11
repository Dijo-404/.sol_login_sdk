# Deployment

End-to-end deploy from a fresh checkout to a production-ready stack. The repo intentionally has **no mock data and no insecure dev fallbacks** — every step here is required.

## 1. External accounts

| Service | Why |
|---|---|
| [Helius](https://www.helius.dev/) | Real per-protocol transaction parsing for reputation. Free tier is sufficient to start. |
| Vercel | Hosts the frontend. |
| Railway / Render / Fly | Hosts the backend container. |
| A managed Postgres (Neon, Supabase, Railway Postgres, RDS, …) | Required — there is no SQLite path. |
| Solana RPC (Helius / QuickNode / Triton) | The public devnet RPC works for staging; production needs a paid endpoint. |

## 2. Anchor program

The backend submits a real transaction for every verified ZK proof, so the on-chain `sol-login` program must exist before the backend will start successfully.

Follow [docs/anchor-deploy.md](./anchor-deploy.md) to:

1. Generate the program keypair, replace `declare_id!` in [programs/sol-login/src/lib.rs](../programs/sol-login/src/lib.rs).
2. `anchor build && anchor deploy`.
3. Copy `target/idl/sol_login.json` to [apps/backend/src/idl/sol_login.json](../apps/backend/src/idl).
4. Generate an issuer keypair and fund it on the target cluster.

Capture: the **program ID** and the **issuer keypair secret** (base58 or JSON byte array).

## 3. ZK circuits

The frontend generates real Groth16 proofs; the backend verifies them with the same verification key. Both consume artifacts built locally.

```bash
# Requires circom 2.x and snarkjs installed (snarkjs is a workspace dep)
pnpm --filter @sol-login/circuits run compile
pnpm --filter @sol-login/circuits run setup
```

This produces, for each of the 4 circuits, in `packages/circuits/build/`:

- `<circuit>.wasm` — used by the prover (frontend)
- `<circuit>_final.zkey` — used by the prover (frontend)
- `<circuit>_vkey.json` — used by the verifier (backend)

The frontend's `prebuild` script copies the `.wasm` and `.zkey` files into `apps/demo/public/circuits/` automatically. The backend reads the `.vkey.json` files directly from `packages/circuits/build/`.

> ⚠️ The provided `setup.sh` does a **single contribution** and is fine for devnet. For mainnet, replace it with a real multi-party ceremony before exposing this to real users.

## 4. Database

Apply migrations against the production Postgres:

```bash
DATABASE_URL=postgresql://... pnpm --filter backend exec prisma migrate deploy
```

The Dockerfile runs `prisma migrate deploy` on container start, so this also happens automatically on every deploy.

## 5. Backend

Required environment variables (see [apps/backend/.env.example](../apps/backend/.env.example)):

- `NODE_ENV=production`
- `SOLANA_NETWORK`, `SOLANA_RPC_URL`
- `HELIUS_API_KEY`
- `JWT_SECRET` (≥ 32 chars, random)
- `JWT_EXPIRY` (e.g. `24h`)
- `DATABASE_URL` (Postgres)
- `ALLOWED_ORIGINS` — comma-separated list, no trailing slashes (e.g. `https://app.sollogin.id,https://demo.sollogin.id`)
- `SOL_LOGIN_PROGRAM_ID` — from step 2
- `SOL_LOGIN_SIGNER_KEY` — from step 2
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` (optional)
- `LOG_LEVEL=info`

### Railway

1. Create a new service from this repo, root directory `apps/backend`.
2. Set "Build" to `Dockerfile` and point it at `apps/backend/Dockerfile` (or use Railway's auto-detected Dockerfile build).
3. Add the env vars above. The container's `CMD` runs migrations then starts the API.
4. Add a Postgres plugin; copy its connection string into `DATABASE_URL`.

### Render / Fly / Generic Docker

```bash
docker build -f apps/backend/Dockerfile -t sol-login-api .
docker run -p 4000:4000 --env-file apps/backend/.env sol-login-api
```

### Verify

After deploy:

```bash
curl https://api.example.com/health   # → {"status":"ok","network":"…"}
curl https://api.example.com/version  # → {"name":"sol-login-api",…,"programId":"…"}
```

## 6. Frontend

Required environment variables (see [apps/demo/.env.example](../apps/demo/.env.example)):

- `VITE_API_URL` — points to the deployed backend, no trailing slash
- `VITE_SOLANA_NETWORK`, `VITE_SOLANA_RPC`

### Vercel

1. Import the repo, root directory `apps/demo`.
2. Vercel auto-detects [apps/demo/vercel.json](../apps/demo/vercel.json). The build command builds `@sol-login/core` + `@sol-login/react` + the demo, and the SPA rewrites are wired.
3. Set the three env vars above.
4. Make sure your domain is included in the backend's `ALLOWED_ORIGINS`.

The `prebuild` script copies circuit artifacts from `packages/circuits/build/` into `apps/demo/public/circuits/` so the prover can fetch them at runtime. **If `packages/circuits/build/` is empty, the build skips the copy and proofs will fail at runtime with a helpful error.** Run the trusted setup before deploy.

### Negative checks

```bash
# Should contain no localhost references
grep -r "localhost" apps/demo/dist || echo "clean"

# Should fail to start if any env var is missing
unset JWT_SECRET && pnpm --filter backend start
```

## 7. CI/CD

[.github/workflows/ci.yml](../.github/workflows/ci.yml) runs on every push and PR — installs deps, builds all packages, spins up Postgres, applies migrations, and verifies the backend's `/health` + `/version` endpoints.

[.github/workflows/deploy.yml](../.github/workflows/deploy.yml) is a manual-dispatch workflow that deploys both frontend and backend. Add these GitHub Secrets to use it:

- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- `RAILWAY_TOKEN`, `RAILWAY_SERVICE_ID`

## 8. Production hardening checklist

- [ ] Anchor program deployed; `SOL_LOGIN_PROGRAM_ID` populated
- [ ] Trusted setup re-run via real multi-party ceremony (mainnet only)
- [ ] `JWT_SECRET` rotated, ≥ 32 chars, never reused across environments
- [ ] `ALLOWED_ORIGINS` restricted to your production domains
- [ ] Paid Solana RPC + Helius plan
- [ ] Issuer keypair funded, monitored, and on a rotation policy
- [ ] Postgres backups configured
- [ ] CORS / rate-limit settings verified from a non-whitelisted origin (should 4xx)
- [ ] `pnpm audit` clean on backend + frontend
