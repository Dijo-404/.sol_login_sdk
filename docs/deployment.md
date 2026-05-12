# Deployment

End-to-end deploy from a fresh checkout to a production-ready stack. The repo intentionally has **no mock data and no insecure dev fallbacks** — every step here is required.

## 1. External accounts

| Service | Why |
|---|---|
| [Helius](https://www.helius.dev/) | Real per-protocol transaction parsing for reputation. Free tier is sufficient to start. |
| Vercel | Hosts the frontend. |
| Render | Hosts the backend container. |
| Supabase or Railway Postgres | Managed PostgreSQL — there is no SQLite path. |
| Solana RPC (Helius / QuickNode / Triton) | The public devnet RPC works for staging; production (mainnet) needs a paid endpoint. |

## 2. Anchor program

The backend submits a real transaction for every verified ZK proof, so the on-chain `sol-login` program must exist before the backend will start successfully.

Follow [docs/anchor-deploy.md](./anchor-deploy.md) to:

1. Generate the program keypair, replace `declare_id!` in [programs/sol-login/src/lib.rs](../programs/sol-login/src/lib.rs).
2. `anchor build && anchor deploy --provider.cluster mainnet`.
3. Copy `target/idl/sol_login.json` to [apps/backend/src/idl/sol_login.json](../apps/backend/src/idl).
4. Generate an issuer keypair and fund it on mainnet.

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

> The provided `setup.sh` does a **single contribution** and is fine for devnet. For mainnet, replace it with a real multi-party ceremony before exposing this to real users.

## 4. Database

### Option A: Supabase (recommended)

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Settings > Database > Connection string > URI**.
3. Copy the connection string: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`.
4. Apply migrations:

```bash
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres" \
  pnpm --filter backend exec prisma migrate deploy
```

### Option B: Railway Postgres

1. Create a new project on [railway.app](https://railway.app) and add a PostgreSQL plugin.
2. Copy the connection string from the plugin settings.
3. Apply migrations the same way as above.

The Dockerfile runs `prisma migrate deploy` on container start, so migrations also run automatically on every deploy.

## 5. Backend (Render)

Required environment variables (see [apps/backend/.env.example](../apps/backend/.env.example)):

- `NODE_ENV=production`
- `SOLANA_NETWORK=mainnet-beta`
- `SOLANA_RPC_URL` — paid Helius/QuickNode/Triton RPC
- `HELIUS_API_KEY`
- `JWT_SECRET` (>= 32 chars, random)
- `JWT_EXPIRY` (e.g. `24h`)
- `DATABASE_URL` (Supabase or Railway Postgres connection string)
- `ALLOWED_ORIGINS` — comma-separated list, no trailing slashes (e.g. `https://your-app.vercel.app`)
- `SOL_LOGIN_PROGRAM_ID` — from step 2
- `SOL_LOGIN_SIGNER_KEY` — from step 2
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` (optional)
- `LOG_LEVEL=info`

### Render setup

1. Go to [render.com](https://render.com) and create a **New Web Service**.
2. Connect your GitHub repo (`Dijo-404/.sol_login_sdk`).
3. Set **Root Directory** to `.` (repo root, since the Dockerfile references the full monorepo).
4. Set **Environment** to `Docker` and **Dockerfile Path** to `./apps/backend/Dockerfile`.
5. Add all environment variables listed above.
6. Render auto-deploys on push to `main`.

Alternatively, use the **render.yaml** Blueprint at the repo root — go to **Blueprints** in the Render dashboard and connect the repo. This creates both the web service and a managed Postgres database automatically.

### Verify

After deploy:

```bash
curl https://sol-login-api.onrender.com/health   # -> {"status":"ok","network":"mainnet-beta"}
curl https://sol-login-api.onrender.com/version   # -> {"name":"sol-login-api",...,"programId":"..."}
```

## 6. Frontend (Vercel)

Required environment variables (see [apps/demo/.env.example](../apps/demo/.env.example)):

- `VITE_API_URL` — points to the deployed Render backend, no trailing slash (e.g. `https://sol-login-api.onrender.com`)
- `VITE_SOLANA_NETWORK=mainnet-beta`
- `VITE_SOLANA_RPC` — paid RPC endpoint

### Vercel setup

1. Import the repo at [vercel.com](https://vercel.com), root directory `apps/demo`.
2. Vercel auto-detects [apps/demo/vercel.json](../apps/demo/vercel.json). The build command builds `@sol-login/core` + `@sol-login/react` + the demo, and the SPA rewrites are wired.
3. Set the three env vars above.
4. Make sure your Vercel domain is included in the backend's `ALLOWED_ORIGINS`.

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
- `RENDER_DEPLOY_HOOK` — create a deploy hook in Render dashboard under your service's Settings

## 8. Production hardening checklist

- [ ] Anchor program deployed to **mainnet-beta**; `SOL_LOGIN_PROGRAM_ID` populated
- [ ] Trusted setup re-run via real multi-party ceremony (mainnet only)
- [ ] `JWT_SECRET` rotated, >= 32 chars, never reused across environments
- [ ] `ALLOWED_ORIGINS` restricted to your production domains
- [ ] Paid Solana RPC (Helius) + Helius API key on a production plan
- [ ] Issuer keypair funded on mainnet, monitored, and on a rotation policy
- [ ] Supabase/Railway Postgres backups configured
- [ ] CORS / rate-limit settings verified from a non-whitelisted origin (should 4xx)
- [ ] `pnpm audit` clean on backend + frontend
- [ ] Render health checks passing
- [ ] Vercel preview deployments tested before promoting to production
