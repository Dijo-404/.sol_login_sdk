# .sol Login SDK

Sign in with your `.sol` name. Own your identity across every Solana app.

An open-source identity primitive that replaces raw wallet connection with a human-readable, reputation-carrying, ZK-verifiable identity layer. Users log in with their `.sol` domain. Developers get a drop-in SDK that resolves wallet, profile, reputation, and ZK credentials in one call.

**Track:** Social Identity -- SNS x Frontier Hackathon

---

## Table of Contents

- [Architecture](#architecture)
- [Authentication Flow](#authentication-flow)
- [ZK Proof Pipeline](#zk-proof-pipeline)
- [Monorepo Structure](#monorepo-structure)
- [Quickstart](#quickstart)
- [SDK Packages](#sdk-packages)
- [Backend API](#backend-api)
- [ZK Circuits](#zk-circuits)
- [Configuration](#configuration)
- [Development](#development)
- [Deployment](#deployment)

---

## Architecture

```mermaid
graph TB
    subgraph Client["Client (Browser)"]
        App["dApp / Demo Frontend"]
        ReactSDK["@sol-login/react"]
        ZKGen["ZK Proof Generator<br/>snarkjs + WASM"]
        App --> ReactSDK
        ReactSDK --> ZKGen
    end

    subgraph Backend["Backend (Node.js / Express)"]
        Auth["Auth API<br/>/auth/*"]
        Identity["Identity Resolver<br/>/identity/*"]
        Reputation["Reputation Engine<br/>/reputation/*"]
        Proof["Proof Verifier<br/>/proof/*"]
    end

    subgraph Infra["Infrastructure"]
        SQLite["SQLite<br/>Sessions + Cache"]
        Solana["Solana RPC<br/>SNS + ZK Program"]
    end

    ReactSDK -- "REST API" --> Auth
    ReactSDK -- "REST API" --> Identity
    ReactSDK -- "REST API" --> Reputation
    ZKGen -- "Proof bytes" --> Proof

    Auth --> SQLite
    Auth --> Solana
    Identity --> Solana
    Reputation --> Solana
    Reputation --> SQLite
    Proof --> SQLite
    Proof --> Solana
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant W as Wallet
    participant C as Client SDK
    participant B as Backend API
    participant S as Solana RPC

    C->>B: POST /auth/challenge { walletAddress }
    B-->>C: { nonce, message }
    C->>W: Sign message (Ed25519)
    W-->>C: signature
    C->>B: POST /auth/verify { walletAddress, signature }
    B->>B: Verify Ed25519 signature
    B->>S: Resolve .sol domain via SNS
    S-->>B: Owner pubkey + records
    B->>S: Compute reputation from on-chain data
    S-->>B: Transaction history, balances
    B->>B: Build SolIdentity object
    B->>B: Issue JWT session
    B-->>C: { token, identity }
    C->>C: Store token, render identity
```

The challenge message is a human-readable string that includes the wallet address, a server-generated nonce, and a timestamp. No blockchain transaction is broadcast during sign-in.

---

## ZK Proof Pipeline

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client (Browser)
    participant B as Backend
    participant S as Solana Program

    U->>C: Request proof (type, threshold)
    C->>C: Load Groth16 circuit (WASM)
    C->>C: Generate witness from private inputs
    C->>C: Compute zk-SNARK proof
    C->>B: POST /proof/verify { proof, publicSignals, type }
    B->>B: Validate proof structure
    B->>S: Call Anchor verifier program
    S-->>B: Verification result
    B->>B: Store verified credential
    B-->>C: { verified, txSignature, credential }
    C->>C: Update identity with new credential
```

Four circuit types are supported:

| Circuit | Private Inputs | Public Inputs | Purpose |
|---|---|---|---|
| `reputation_threshold` | score, salt | threshold, commitment | Prove score exceeds threshold |
| `wallet_age` | firstTxTimestamp, salt | minAge, commitment, now | Prove wallet age exceeds minimum |
| `sybil_nullifier` | domainHash, secret | nullifier, appId | Per-app unique human proof |
| `social_ownership` | handle, secret | commitment | Prove social account ownership |

---

## Monorepo Structure

```
sol-login/
  apps/
    demo/                   Vite + React demo app
    backend/                Express.js API server
  packages/
    core/                   @sol-login/core (framework-agnostic)
    react/                  @sol-login/react (hooks + provider)
    express/                @sol-login/express (session middleware)
    circuits/               Circom ZK circuits (Groth16)
  programs/
    sol-login/              Anchor smart contract (ZK verifier)
```

---

## Quickstart

### Prerequisites

- Node.js 20+
- pnpm 9+

### Install and Run

```bash
git clone https://github.com/Dijo-404/.sol_login_sdk.git
cd .sol_login_sdk
pnpm install
pnpm dev:all
```

This starts:
- Frontend at `http://localhost:5173`
- Backend API at `http://localhost:4000`

### Integrate into Your dApp

```bash
yarn add @sol-login/react @sol-login/core
```

```jsx
import { SolLoginProvider, useSolLogin } from '@sol-login/react'

function App() {
  return (
    <SolLoginProvider apiUrl="https://api.sollogin.id">
      <Page />
    </SolLoginProvider>
  )
}

function Page() {
  const { identity } = useSolLogin()
  if (!identity) return <SolLoginButton />
  return <h1>gm, {identity.domain}</h1>
}
```

---

## SDK Packages

### @sol-login/core

Framework-agnostic client and type definitions.

```
packages/core/src/
  client.js          SolLoginClient (API client)
  types.js           SolIdentity, ReputationScore, ZkCredential types
  auth/
    challenge.js     Challenge message builder
    session.js       Client-side JWT storage
  identity/
    resolver.js      SNS domain resolution via Bonfida
```

Key exports:
- `SolLoginClient` -- API client with auth, identity, reputation, and proof methods
- `buildChallengeMessage` -- Generates the sign-in challenge string
- `resolveDomain` / `reverseResolveDomain` -- SNS resolution helpers
- `REPUTATION_WEIGHTS` -- Scoring weight constants

### @sol-login/react

React bindings built on top of core.

```
packages/react/src/
  context/
    SolLoginProvider.jsx   Context provider + state management
  index.js                 Re-exports
```

Key exports:
- `SolLoginProvider` -- Wraps the app with identity state
- `useSolLogin` -- Hook returning identity, login, logout, requestProof

### @sol-login/express

Server-side session verification middleware.

```
packages/express/src/
  index.js    verifySolSession middleware
```

Usage:
```js
import { verifySolSession } from '@sol-login/express'

app.get('/protected', verifySolSession(JWT_SECRET), (req, res) => {
  res.json({ wallet: req.solIdentity.wallet })
})
```

---

## Backend API

### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/challenge` | No | Issue nonce + message for wallet to sign |
| `POST` | `/auth/verify` | No | Verify signature, resolve identity, issue JWT |
| `GET` | `/auth/me` | Yes | Return current session identity |
| `POST` | `/auth/logout` | Yes | Invalidate session |
| `GET` | `/identity/:name` | No | Resolve .sol name to SolIdentity |
| `GET` | `/identity/reverse/:wallet` | No | Reverse resolve wallet to .sol |
| `GET` | `/identity/explore/leaderboard` | No | List all known identities |
| `GET` | `/reputation/:wallet` | No | Get reputation score breakdown |
| `POST` | `/reputation/:wallet/refresh` | Yes | Force re-index reputation |
| `POST` | `/proof/verify` | Yes | Submit ZK proof for verification |
| `GET` | `/proof/:wallet/credentials` | No | Get verified credentials |

### Data Model

```mermaid
erDiagram
    sessions {
        text id PK
        text wallet
        text token UK
        text domain
        text created_at
        text expires_at
    }
    reputation_cache {
        text wallet PK
        int score
        text breakdown
        text indexed_at
    }
    verified_credentials {
        text id PK
        text wallet FK
        text type
        int threshold
        text tx_sig
        text verified_at
        text expires_at
    }
    sessions ||--o{ verified_credentials : wallet
```

---

## ZK Circuits

Located in `packages/circuits/`. Each circuit is written in Circom 2.0 and compiled to Groth16.

| File | Description |
|---|---|
| `reputation_threshold.circom` | Prove reputation score >= threshold |
| `wallet_age.circom` | Prove wallet age >= N months |
| `sybil_nullifier.circom` | Per-app uniqueness via Poseidon nullifier |
| `social_ownership.circom` | Prove social account ownership blind |

### Compile

```bash
cd packages/circuits
./scripts/compile.sh
./scripts/setup.sh
```

Outputs: `.wasm`, `.zkey`, `.vkey` files in `build/`.

---

## Configuration

### Frontend (.env)

```
VITE_API_URL=http://localhost:4000
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC=https://api.devnet.solana.com
```

### Backend (.env)

```
PORT=4000
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
JWT_SECRET=<random-256-bit-secret>
JWT_EXPIRY=24h
```

---

## Development

```bash
pnpm dev              # Frontend only
pnpm dev:backend      # Backend only
pnpm dev:all          # Both in parallel
pnpm build            # Production build all packages
pnpm lint             # Lint all packages
```

### Wallet Support

The demo app supports all Wallet Standard-compliant wallets:
- Phantom
- Solflare
- Backpack
- MetaMask (via Solflare Snap)

Wallets are auto-detected at runtime. No legacy adapters are required.

---

## Deployment

### Frontend (Vercel)

```bash
cd apps/demo && pnpm build
```

Set environment variables in Vercel dashboard.

### Backend (Railway / Render)

```bash
cd apps/backend && node src/index.js
```

Required environment variables: `PORT`, `SOLANA_RPC_URL`, `JWT_SECRET`.

The backend uses SQLite by default. For production, swap `better-sqlite3` for PostgreSQL via Prisma.

---

## Reputation Scoring

Scores range from 0 to 1000, computed from on-chain data:

| Factor | Weight | Source |
|---|---|---|
| DeFi activity | 30% | Transaction count (Jupiter, Marinade, Drift) |
| Governance | 25% | SOL balance proxy (Realms participation) |
| NFT activity | 15% | Transaction frequency (Tensor, Magic Eden) |
| Domain age | 20% | Time since first transaction |
| Social verification | 10% | Token account presence |

Scores are cached for 6 hours in SQLite with an option to force re-index.

---

## License

MIT
