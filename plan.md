# .sol Login SDK — Full Project Plan

> **Track:** Social Identity — SNS × Frontier Hackathon  
> **Tagline:** Sign in with your `.sol` name. Own your identity across every Solana app.

---

## 1. Vision

The `.sol Login SDK` is an open-source developer primitive that lets any Solana dApp replace raw wallet connection with a human-readable, reputation-carrying, ZK-verifiable identity layer. Users log in with their `.sol` domain. Developers get a drop-in SDK that resolves wallet, profile, reputation, and ZK credentials in one call.

Think: **Sign in with Google, but onchain, permissionless, and owned by the user.**

---

## 2. Core Features

### 2.1 Authentication
- **Sign in with .sol** — wallet signature + `.sol` domain resolution in one flow
- **Session tokens** — JWT-based sessions tied to wallet pubkey, rotatable by user
- **Multi-wallet support** — Phantom, Backpack, Solflare, Glow
- **Fallback mode** — raw wallet address login if no `.sol` domain registered

### 2.2 Identity Resolution
- Resolve `.sol` → wallet address via SNS Protocol
- Reverse resolve wallet address → `.sol` name
- Pull linked socials: Twitter/X, GitHub, Discord, Farcaster (via SNS records)
- Pull avatar (NFT PFP or IPFS image stored in SNS record)
- Expose all data as a composable `SolIdentity` object

### 2.3 ZK-Proof Verification (Core Differentiator)
- **ZK Age/Tier Proof** — prove wallet is > N months old without revealing exact age
- **ZK Reputation Proof** — prove reputation score is above a threshold without revealing exact score
- **ZK Social Proof** — prove ownership of a social account without revealing the account handle
- **ZK Sybil Resistance** — prove uniqueness (one `.sol` per human) using nullifier commitments
- Proofs generated client-side using **Groth16** (via `snarkjs`) over pre-compiled circuits
- Smart contracts on Solana verify proofs onchain via a custom ZK verifier program

### 2.4 Reputation Engine
- Aggregate onchain activity into a `ReputationScore` (0–1000):
  - DeFi activity (Jupiter swaps, Marinade staking, Drift positions)
  - Governance participation (Realms votes)
  - NFT activity (Tensor, Magic Eden)
  - `.sol` domain age and tier
  - Social link verification
- Score stored offchain (indexed), verifiable claim issued as ZK proof
- Third-party dApps query reputation without reading raw activity

### 2.5 Developer SDK
- `@sol-login/core` — framework-agnostic TypeScript SDK
- `@sol-login/react` — React hooks and pre-built UI components
- `@sol-login/express` — Express.js middleware for backend session handling
- One-line integration: `<SolLoginButton />` renders a full login flow
- Callback hooks: `onLogin`, `onLogout`, `onIdentityResolved`, `onProofVerified`

### 2.6 Identity Dashboard (Demo App)
- Visual explorer for a user's `.sol` identity card
- Shows: avatar, name, linked socials, reputation score, ZK credentials held
- Shareable public profile URL: `solid.app/[name].sol`
- Privacy controls: toggle visibility of each attribute

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐│
│  │  dApp / Demo │   │ @sol-login/  │   │  ZK Proof Generator  ││
│  │  Frontend    │──▶│  react SDK   │──▶│  (snarkjs, WASM)     ││
│  └──────────────┘   └──────────────┘   └──────────────────────┘│
│                              │                       │           │
└──────────────────────────────┼───────────────────────┼──────────┘
                               │                       │
                    REST/WS API│              Proof bytes│
                               ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (Node.js)                        │
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐│
│  │  Auth API    │   │  Identity    │   │  Reputation          ││
│  │  /session    │   │  Resolver    │   │  Indexer             ││
│  └──────────────┘   └──────────────┘   └──────────────────────┘│
│          │                  │                       │            │
└──────────┼──────────────────┼───────────────────────┼───────────┘
           │                  │                       │
           ▼                  ▼                       ▼
┌──────────────┐   ┌──────────────────┐   ┌──────────────────────┐
│  Redis       │   │  Solana RPC      │   │  PostgreSQL          │
│  (Sessions)  │   │  (SNS, ZK prog)  │   │  (Reputation cache)  │
└──────────────┘   └──────────────────┘   └──────────────────────┘
```

---

## 4. Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Wallet Adapter | `@solana/wallet-adapter-react` |
| SNS Resolution | `@bonfida/spl-name-service` |
| ZK Client | `snarkjs` + compiled WASM circuits |
| State | Zustand |
| Styling | Tailwind CSS + shadcn/ui |
| SDK Packaging | tsup + Turborepo monorepo |

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js 20 + TypeScript |
| Framework | Express.js |
| Auth | JWT (`jsonwebtoken`) + Ed25519 signature verification |
| Session Store | Redis (via `ioredis`) |
| Database | PostgreSQL + Prisma ORM |
| Solana Client | `@solana/web3.js` |
| ZK Verifier | Custom Anchor program (Groth16 verifier) |
| Queue | BullMQ (reputation indexing jobs) |

### Blockchain
| Layer | Technology |
|---|---|
| Network | Solana Devnet → Mainnet |
| Smart Contracts | Anchor Framework (Rust) |
| Identity Protocol | SNS (Solana Name Service) |
| ZK Circuits | Circom 2.0 + Groth16 |
| ZK Verifier | Solana Anchor program calling `solana_zk_token_sdk` primitives |

---

## 5. File Structure

```
sol-login/
├── apps/
│   ├── demo/                          # Identity Explorer demo app (Next.js)
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               # Landing page
│   │   │   ├── [name]/
│   │   │   │   └── page.tsx           # Public profile: solid.app/[name].sol
│   │   │   └── dashboard/
│   │   │       └── page.tsx           # Logged-in identity dashboard
│   │   ├── components/
│   │   │   ├── LoginButton.tsx        # Wraps @sol-login/react
│   │   │   ├── IdentityCard.tsx       # Visual identity card
│   │   │   ├── ReputationMeter.tsx    # Score visualizer
│   │   │   ├── ZkCredentialBadge.tsx  # Shows held ZK proofs
│   │   │   └── SocialLinks.tsx
│   │   ├── hooks/
│   │   │   └── useIdentity.ts         # Thin wrapper over SDK hooks
│   │   ├── lib/
│   │   │   └── api.ts                 # Calls backend REST API
│   │   └── public/
│   │       └── circuits/              # Compiled WASM + zkey files served statically
│   │           ├── reputation.wasm
│   │           ├── reputation_final.zkey
│   │           ├── age.wasm
│   │           └── age_final.zkey
│   │
│   └── backend/                       # Express.js API server
│       ├── src/
│       │   ├── index.ts               # App entry point
│       │   ├── config/
│       │   │   ├── env.ts             # Zod-validated env vars
│       │   │   └── solana.ts          # RPC connection setup
│       │   ├── routes/
│       │   │   ├── auth.ts            # POST /auth/challenge, POST /auth/verify
│       │   │   ├── identity.ts        # GET /identity/:name
│       │   │   ├── reputation.ts      # GET /reputation/:wallet
│       │   │   └── proof.ts           # POST /proof/verify
│       │   ├── middleware/
│       │   │   ├── authenticate.ts    # JWT guard middleware
│       │   │   └── rateLimit.ts
│       │   ├── services/
│       │   │   ├── auth.service.ts    # Signature verification, session mgmt
│       │   │   ├── sns.service.ts     # SNS resolution logic
│       │   │   ├── reputation.service.ts  # Score calculation
│       │   │   ├── zk.service.ts      # Calls Solana ZK verifier program
│       │   │   └── indexer.service.ts # Background onchain activity indexer
│       │   ├── jobs/
│       │   │   └── reputation.job.ts  # BullMQ worker for async indexing
│       │   ├── db/
│       │   │   ├── prisma/
│       │   │   │   └── schema.prisma
│       │   │   └── client.ts
│       │   └── utils/
│       │       ├── signature.ts       # Ed25519 verify helper
│       │       └── solana.ts          # RPC helpers
│       ├── .env.example
│       └── tsconfig.json
│
├── packages/
│   ├── core/                          # @sol-login/core (framework-agnostic)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── types.ts               # SolIdentity, ReputationScore, ZkProof types
│   │   │   ├── client.ts              # SolLoginClient class
│   │   │   ├── auth/
│   │   │   │   ├── challenge.ts       # Generate/verify challenge messages
│   │   │   │   └── session.ts         # Session token management
│   │   │   ├── identity/
│   │   │   │   ├── resolver.ts        # SNS domain → SolIdentity
│   │   │   │   └── social.ts          # Pull linked social records
│   │   │   └── zk/
│   │   │       ├── prover.ts          # Client-side proof generation
│   │   │       ├── circuits.ts        # Circuit loader (WASM/zkey)
│   │   │       └── types.ts           # ProofRequest, ProofResult types
│   │   └── package.json
│   │
│   ├── react/                         # @sol-login/react
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── context/
│   │   │   │   └── SolLoginProvider.tsx   # Context + state
│   │   │   ├── hooks/
│   │   │   │   ├── useSolLogin.ts         # Main hook: login, logout, identity
│   │   │   │   ├── useReputation.ts       # Fetch + cache reputation score
│   │   │   │   └── useZkProof.ts          # Trigger + track proof generation
│   │   │   └── components/
│   │   │       ├── SolLoginButton.tsx     # Drop-in login button
│   │   │       ├── IdentityBadge.tsx      # Compact name + avatar display
│   │   │       └── ZkProofModal.tsx       # UI for proof request flow
│   │   └── package.json
│   │
│   ├── express/                        # @sol-login/express
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── middleware.ts           # requireSolAuth() middleware
│   │   └── package.json
│   │
│   └── circuits/                       # Circom ZK circuits
│       ├── reputation_threshold.circom # Prove score > threshold
│       ├── wallet_age.circom           # Prove wallet age > N months
│       ├── social_ownership.circom     # Prove social account ownership
│       ├── sybil_nullifier.circom      # Unique human commitment
│       ├── build/                      # Compiled outputs (.wasm, .zkey, .vkey)
│       └── scripts/
│           ├── compile.sh              # circom → r1cs → wasm
│           └── setup.sh                # Powers of tau ceremony + zkey gen
│
├── programs/                           # Solana Anchor smart contracts
│   └── sol-login/
│       ├── src/
│       │   ├── lib.rs                  # Program entry
│       │   ├── instructions/
│       │   │   ├── verify_proof.rs     # Groth16 proof verifier
│       │   │   ├── register_agent.rs   # Agent identity registry (bonus)
│       │   │   └── issue_credential.rs # Issue verified credential NFT
│       │   ├── state/
│       │   │   ├── identity_record.rs  # PDA: wallet → .sol mapping
│       │   │   └── credential.rs       # Verified credential account
│       │   └── errors.rs
│       └── Cargo.toml
│
├── docs/
│   ├── quickstart.md
│   ├── sdk-reference.md
│   ├── zk-circuits.md
│   └── architecture.md
│
├── turbo.json
├── package.json                        # Monorepo root
└── pnpm-workspace.yaml
```

---

## 6. ZK Proof Architecture

### Circuits

#### `reputation_threshold.circom`
```
Inputs (private): reputationScore, salt
Inputs (public):  threshold, commitment
Outputs:          proof that score >= threshold

Logic:
  commitment = Poseidon(reputationScore, salt)
  assert(reputationScore >= threshold)
```

#### `wallet_age.circom`
```
Inputs (private): firstTxTimestamp, salt
Inputs (public):  minAgeSeconds, commitment, currentTimestamp
Outputs:          proof that wallet age >= minAgeSeconds
```

#### `sybil_nullifier.circom`
```
Inputs (private): solDomainHash, userSecret
Inputs (public):  nullifier, appId
Outputs:          nullifier = Poseidon(solDomainHash, userSecret, appId)
                  (same user cannot generate two different nullifiers per app)
```

### Proof Flow

```
1. dApp requests a ZK proof via SDK:
   sdk.requestProof({ type: 'reputation', threshold: 500 })

2. SDK fetches user's raw reputation data from backend (authenticated)

3. WASM circuit runs in browser:
   const { proof, publicSignals } = await snarkjs.groth16.fullProve(
     { reputationScore, salt },
     'reputation.wasm',
     'reputation_final.zkey'
   )

4. Proof + publicSignals sent to backend:
   POST /proof/verify { proof, publicSignals, type }

5. Backend calls Solana program via RPC:
   await program.methods.verifyProof(proof, publicSignals).rpc()

6. Program verifies Groth16 proof using hardcoded verification key
   → emits VerificationEvent

7. Backend issues a signed credential JWT:
   { wallet, proofType, threshold, verifiedAt, sig }

8. dApp stores credential, gates features accordingly
```

---

## 7. Authentication Flow

### Step-by-Step Login

```
FRONTEND                          BACKEND                        SOLANA
   │                                  │                              │
   │── POST /auth/challenge ─────────▶│                              │
   │   { walletAddress }              │                              │
   │                                  │  Generate nonce              │
   │◀─ { nonce, message } ───────────│                              │
   │                                  │                              │
   │  User signs message in wallet    │                              │
   │                                  │                              │
   │── POST /auth/verify ────────────▶│                              │
   │   { walletAddress, signature,    │  Verify Ed25519 signature    │
   │     solDomain (optional) }       │                              │
   │                                  │── SNS.resolve(solDomain) ──▶│
   │                                  │◀─ { owner: pubkey } ────────│
   │                                  │                              │
   │                                  │  Assert owner == walletAddr  │
   │                                  │  Build SolIdentity object    │
   │                                  │  Issue JWT session           │
   │◀─ { token, identity } ──────────│                              │
   │                                  │                              │
   │  Store token in memory/cookie    │                              │
   │  Render identity in UI           │                              │
```

### Challenge Message Format
```
Sign in to [App Name] with your Solana identity.

Domain: app.example.com
Wallet: GxSf...3k9P
.sol Name: dijo.sol
Nonce: a3f7b2c9
Issued At: 2026-04-30T10:00:00Z

This request will not trigger any blockchain transaction or cost any fees.
```

---

## 8. Backend API Endpoints

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/auth/challenge` | Issue nonce + message for wallet to sign |
| POST | `/auth/verify` | Verify signature, issue JWT session |
| POST | `/auth/logout` | Invalidate session in Redis |
| GET | `/auth/me` | Return current session identity |

### Identity
| Method | Path | Description |
|---|---|---|
| GET | `/identity/:name` | Resolve `.sol` name → full `SolIdentity` |
| GET | `/identity/reverse/:wallet` | Reverse resolve wallet → `.sol` name |
| GET | `/identity/:name/social` | Get linked social accounts |

### Reputation
| Method | Path | Description |
|---|---|---|
| GET | `/reputation/:wallet` | Get reputation breakdown + total score |
| POST | `/reputation/:wallet/refresh` | Trigger async re-index of onchain activity |

### ZK Proofs
| Method | Path | Description |
|---|---|---|
| POST | `/proof/verify` | Submit proof for onchain verification |
| GET | `/proof/:wallet/credentials` | Get all verified credentials for a wallet |

---

## 9. Data Models

### `SolIdentity` (TypeScript type in `@sol-login/core`)
```typescript
interface SolIdentity {
  wallet: string               // Base58 pubkey
  domain: string | null        // "dijo.sol"
  avatar: string | null        // IPFS or Arweave URL
  displayName: string | null
  bio: string | null
  socials: {
    twitter?: string
    github?: string
    discord?: string
    farcaster?: string
  }
  reputation: ReputationScore | null
  credentials: ZkCredential[]
  resolvedAt: number           // Unix timestamp
}

interface ReputationScore {
  total: number                // 0–1000
  breakdown: {
    defi: number
    governance: number
    nft: number
    domainAge: number
    socialVerification: number
  }
}

interface ZkCredential {
  type: 'reputation_threshold' | 'wallet_age' | 'sybil_nullifier' | 'social_ownership'
  threshold?: number
  verifiedAt: number
  txSignature: string          // Solana tx where proof was verified
  expiresAt: number | null
}
```

### Prisma Schema (`schema.prisma`)
```prisma
model Session {
  id          String   @id @default(cuid())
  wallet      String
  token       String   @unique
  domain      String?
  createdAt   DateTime @default(now())
  expiresAt   DateTime
}

model ReputationCache {
  wallet      String   @id
  score       Int
  breakdown   Json
  indexedAt   DateTime @default(now())
}

model VerifiedCredential {
  id          String   @id @default(cuid())
  wallet      String
  type        String
  threshold   Int?
  txSig       String
  verifiedAt  DateTime
  expiresAt   DateTime?

  @@index([wallet])
}
```

---

## 10. Connecting Frontend and Backend

### Step 1 — Environment Setup

**Backend `.env`**
```env
PORT=4000
DATABASE_URL=postgresql://user:pass@localhost:5432/sollogin
REDIS_URL=redis://localhost:6379
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=<your_anchor_program_id>
JWT_SECRET=<random_256bit_secret>
JWT_EXPIRY=24h
```

**Frontend `.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_PROGRAM_ID=<your_anchor_program_id>
```

### Step 2 — Initialize SDK in Frontend

```typescript
// apps/demo/lib/sdk.ts
import { SolLoginClient } from '@sol-login/core'

export const solLogin = new SolLoginClient({
  apiUrl: process.env.NEXT_PUBLIC_API_URL!,
  network: process.env.NEXT_PUBLIC_SOLANA_NETWORK as 'devnet' | 'mainnet-beta',
  circuitsPath: '/circuits',          // served from /public/circuits
})
```

### Step 3 — Wrap App with Providers

```tsx
// apps/demo/app/layout.tsx
import { SolLoginProvider } from '@sol-login/react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { PhantomWalletAdapter, BackpackWalletAdapter } from '@solana/wallet-adapter-wallets'

export default function RootLayout({ children }) {
  const wallets = [new PhantomWalletAdapter(), new BackpackWalletAdapter()]

  return (
    <ConnectionProvider endpoint={process.env.NEXT_PUBLIC_SOLANA_RPC!}>
      <WalletProvider wallets={wallets} autoConnect>
        <SolLoginProvider client={solLogin}>
          {children}
        </SolLoginProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
```

### Step 4 — Drop in Login Button

```tsx
// Any page or component
import { SolLoginButton, useSolLogin } from '@sol-login/react'

export default function Navbar() {
  const { identity, isLoading, logout } = useSolLogin()

  return (
    <nav>
      {identity ? (
        <div>
          <img src={identity.avatar} />
          <span>{identity.domain ?? identity.wallet.slice(0, 6)}</span>
          <button onClick={logout}>Sign Out</button>
        </div>
      ) : (
        <SolLoginButton
          onSuccess={(identity) => console.log('Logged in:', identity)}
          onError={(err) => console.error(err)}
        />
      )}
    </nav>
  )
}
```

### Step 5 — Protect Backend Routes

```typescript
// apps/backend/src/routes/reputation.ts
import { authenticate } from '../middleware/authenticate'

router.get('/reputation/:wallet', authenticate, async (req, res) => {
  const { wallet } = req.params
  // req.user is populated by authenticate middleware
  const score = await reputationService.getScore(wallet)
  res.json(score)
})
```

### Step 6 — ZK Proof Request from Frontend

```typescript
// In a gated feature component
import { useZkProof } from '@sol-login/react'

export function PremiumFeature() {
  const { requestProof, credential, isProving } = useZkProof()

  const handleUnlock = async () => {
    // Generates proof in browser, verifies onchain, returns credential
    await requestProof({
      type: 'reputation_threshold',
      threshold: 500,
    })
  }

  if (credential) return <PremiumContent />

  return (
    <button onClick={handleUnlock} disabled={isProving}>
      {isProving ? 'Generating ZK Proof...' : 'Prove Reputation ≥ 500 to Unlock'}
    </button>
  )
}
```

---

## 11. Anchor Program — Key Instructions

### `verify_proof` instruction
```rust
pub fn verify_proof(
    ctx: Context<VerifyProof>,
    proof_a: [u8; 64],
    proof_b: [u8; 128],
    proof_c: [u8; 64],
    public_inputs: Vec<[u8; 32]>,
    proof_type: u8,
) -> Result<()> {
    // Load verification key for proof_type from program data
    let vk = load_verification_key(proof_type)?;

    // Verify Groth16 proof
    let valid = groth16_verify(&vk, &proof_a, &proof_b, &proof_c, &public_inputs)?;
    require!(valid, SolLoginError::InvalidProof);

    // Write verified credential PDA
    let credential = &mut ctx.accounts.credential;
    credential.wallet = ctx.accounts.signer.key();
    credential.proof_type = proof_type;
    credential.verified_at = Clock::get()?.unix_timestamp;

    emit!(ProofVerified {
        wallet: credential.wallet,
        proof_type,
        verified_at: credential.verified_at,
    });

    Ok(())
}
```

---

## 12. Reputation Scoring Logic

```typescript
// packages/core/src/reputation/scorer.ts

const WEIGHTS = {
  defi:               0.30,   // Jupiter/Marinade/Drift activity
  governance:         0.25,   // Realms votes cast
  nft:                0.15,   // Tensor/MagicEden transactions
  domainAge:          0.20,   // .sol domain registration age
  socialVerification: 0.10,   // Linked + verified social accounts
}

async function computeScore(wallet: string): Promise<ReputationScore> {
  const [defi, gov, nft, domain, social] = await Promise.all([
    scoreDefiActivity(wallet),
    scoreGovernance(wallet),
    scoreNftActivity(wallet),
    scoreDomainAge(wallet),
    scoreSocialLinks(wallet),
  ])

  const total = Math.round(
    defi   * WEIGHTS.defi   * 1000 +
    gov    * WEIGHTS.governance * 1000 +
    nft    * WEIGHTS.nft    * 1000 +
    domain * WEIGHTS.domainAge * 1000 +
    social * WEIGHTS.socialVerification * 1000
  )

  return { total: Math.min(total, 1000), breakdown: { defi, governance: gov, nft, domainAge: domain, socialVerification: social } }
}
```

---

## 13. Third-Party Integration Guide (for dApp developers)

### Minimal integration — 3 lines
```tsx
import { SolLoginProvider, SolLoginButton } from '@sol-login/react'

// 1. Wrap your app
<SolLoginProvider apiUrl="https://api.sollogin.id">

// 2. Drop in button
<SolLoginButton onSuccess={handleLogin} />

// 3. Use identity anywhere
const { identity } = useSolLogin()
```

### Gate a feature behind ZK reputation proof
```tsx
const { requestProof, credential } = useZkProof()
await requestProof({ type: 'reputation_threshold', threshold: 300 })
// credential is now a signed JWT + onchain tx signature
```

### Backend: verify a session token
```typescript
import { verifySolSession } from '@sol-login/express'

app.get('/protected', verifySolSession(process.env.JWT_SECRET), (req, res) => {
  res.json({ wallet: req.solIdentity.wallet })
})
```

---

## 14. Demo App Pages

| Route | Description |
|---|---|
| `/` | Landing page with SDK pitch + "Try it live" login demo |
| `/dashboard` | Logged-in user's full identity card + reputation + credentials |
| `/[name]` | Public profile page for any `.sol` name |
| `/explore` | Leaderboard of top reputation scores |
| `/docs` | Embedded quickstart + API reference |

---

## 15. Submission Checklist

- [ ] Monorepo published to public GitHub
- [ ] `@sol-login/core`, `@sol-login/react`, `@sol-login/express` packages in `/packages`
- [ ] Anchor program deployed to Devnet, program ID documented
- [ ] ZK circuits compiled, `.wasm` + `.zkey` + `.vkey` committed to repo
- [ ] Demo app live (Vercel) with working login flow
- [ ] Backend API live (Railway / Render) with all endpoints functional
- [ ] `README.md` with: problem, architecture diagram, quickstart, live links
- [ ] Pitch deck covering: problem → solution → architecture → demo → why SNS → roadmap
- [ ] 3-minute demo video: login flow → identity resolution → ZK proof gate
- [ ] Submitted on Colosseum (select Malaysia) + Superteam Earn
- [ ] Code access granted to `malaysia@superteam.fun` and `contact@sns.id`
