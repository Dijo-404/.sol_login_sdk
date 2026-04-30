import { motion } from "framer-motion";
import CodeBlock from "@/components/CodeBlock";
import { useState } from "react";
import { Book, Code2, Zap, Shield, Server } from "lucide-react";

const SECTIONS = [
  { id: "quickstart", label: "Quickstart", icon: Zap },
  { id: "react", label: "React SDK", icon: Code2 },
  { id: "api", label: "Backend API", icon: Server },
  { id: "zk", label: "ZK Proofs", icon: Shield },
  { id: "types", label: "Types", icon: Book },
];

const SNIPPETS = {
  install: `# Install
yarn add @sol-login/react @sol-login/core @sol-login/express

# Optional: wallet adapter peer deps
yarn add @solana/wallet-adapter-react @solana/wallet-adapter-wallets`,
  provider: `import { SolLoginProvider } from '@sol-login/react'

export default function App({ children }) {
  return (
    <SolLoginProvider
      apiUrl="https://api.sollogin.id"
      network="devnet"
    >
      {children}
    </SolLoginProvider>
  )
}`,
  button: `import { SolLoginButton, useSolLogin } from '@sol-login/react'

function Navbar() {
  const { identity, logout } = useSolLogin()

  if (identity) {
    return (
      <button onClick={logout}>
        {identity.domain ?? identity.wallet.slice(0, 6)}
      </button>
    )
  }

  return (
    <SolLoginButton
      onSuccess={(id) => console.log('logged in:', id)}
    />
  )
}`,
  reputation: `import { useReputation } from '@sol-login/react'

function Profile({ wallet }) {
  const { score, breakdown, isLoading } = useReputation(wallet)
  if (isLoading) return null
  return <div>Score: {score} / 1000</div>
}`,
  zk: `import { useZkProof } from '@sol-login/react'

function PremiumGate() {
  const { requestProof, credential, isProving } = useZkProof()

  if (credential) return <PremiumContent />

  return (
    <button
      onClick={() => requestProof({
        type: 'reputation_threshold',
        threshold: 500,
      })}
      disabled={isProving}
    >
      {isProving ? 'Generating proof…' : 'Unlock with ZK proof'}
    </button>
  )
}`,
  api: `# Auth
POST   /auth/challenge        # → { nonce, message }
POST   /auth/verify           # → { token, identity }
POST   /auth/logout
GET    /auth/me               # → SolIdentity

# Identity
GET    /identity/:name        # → SolIdentity
GET    /identity/reverse/:wallet
GET    /identity/:name/social

# Reputation
GET    /reputation/:wallet    # → { total, breakdown }
POST   /reputation/:wallet/refresh

# ZK Proofs
POST   /proof/verify
GET    /proof/:wallet/credentials`,
  express: `import express from 'express'
import { verifySolSession } from '@sol-login/express'

const app = express()

app.get(
  '/protected',
  verifySolSession(process.env.JWT_SECRET),
  (req, res) => {
    // req.solIdentity is populated
    res.json({ wallet: req.solIdentity.wallet })
  }
)`,
  types: `interface SolIdentity {
  wallet: string
  domain: string | null
  avatar: string | null
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
}

interface ReputationScore {
  total: number    // 0–1000
  breakdown: {
    defi: number
    governance: number
    nft: number
    domainAge: number
    socialVerification: number
  }
}

interface ZkCredential {
  type: 'reputation_threshold' | 'wallet_age'
      | 'sybil_nullifier' | 'social_ownership'
  threshold?: number
  verifiedAt: number
  txSignature: string
  expiresAt: number | null
}`,
  zkCircuit: `// reputation_threshold.circom
template ReputationThreshold() {
  signal input reputationScore;  // private
  signal input salt;             // private
  signal input threshold;        // public
  signal input commitment;       // public

  // Assert score >= threshold
  component gte = GreaterEqThan(10);
  gte.in[0] <== reputationScore;
  gte.in[1] <== threshold;
  gte.out === 1;

  // Bind to commitment
  component p = Poseidon(2);
  p.inputs[0] <== reputationScore;
  p.inputs[1] <== salt;
  p.out === commitment;
}

component main = ReputationThreshold();`,
};

const Section = ({ id, title, eyebrow, children }) => (
  <motion.section id={id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.5 }}
    className="scroll-mt-28" data-testid={`docs-section-${id}`}>
    {eyebrow && <div className="mono-label mb-3">{eyebrow}</div>}
    <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight">{title}</h2>
    <div className="mt-6 space-y-5">{children}</div>
  </motion.section>
);

const Docs = () => {
  const [active, setActive] = useState("quickstart");

  return (
    <div className="relative pt-28 pb-20" data-testid="docs-page">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="mb-12">
          <div className="mono-label mb-3">Documentation · v0.1.0</div>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight font-medium">
            Build with <span className="text-gradient-sol">.sol Login</span>
          </h1>
          <p className="mt-3 text-slate-400 max-w-lg">
            Quickstart, SDK reference, ZK circuit anatomy, and backend integration — everything you need to ship.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-24">
              <div className="mono-label mb-4">Sections</div>
              <nav className="space-y-1">
                {SECTIONS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <a key={s.id} href={`#${s.id}`} onClick={() => setActive(s.id)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-mono transition-all ${
                        active === s.id ? "bg-white/[0.06] text-white border border-white/10" : "text-slate-400 hover:text-white hover:bg-white/[0.02] border border-transparent"
                      }`} data-testid={`docs-nav-${s.id}`}>
                      <Icon size={13} />{s.label}
                    </a>
                  );
                })}
              </nav>
            </div>
          </aside>

          <div className="lg:col-span-9 space-y-16">
            <Section id="quickstart" eyebrow="01" title="Quickstart">
              <p className="text-slate-400 leading-relaxed">
                The SDK ships as three packages — framework-agnostic{" "}<span className="font-mono text-sol-teal">core</span>, the{" "}
                <span className="font-mono text-sol-teal">react</span> bindings, and an{" "}<span className="font-mono text-sol-teal">express</span> middleware. Install, wrap, and ship.
              </p>
              <CodeBlock code={SNIPPETS.install} language="bash" filename="install" accent="teal" />
              <CodeBlock code={SNIPPETS.provider} language="tsx" filename="app/layout.tsx" accent="purple" />
            </Section>

            <Section id="react" eyebrow="02" title="React SDK">
              <p className="text-slate-400">
                <span className="font-mono text-sol-teal">@sol-login/react</span> ships the{" "}
                <span className="font-mono">SolLoginButton</span> component plus three hooks:{" "}
                <span className="font-mono">useSolLogin</span>,{" "}<span className="font-mono">useReputation</span>,{" "}<span className="font-mono">useZkProof</span>.
              </p>
              <CodeBlock code={SNIPPETS.button} language="tsx" filename="Navbar.tsx" accent="purple" />
              <CodeBlock code={SNIPPETS.reputation} language="tsx" filename="Profile.tsx" accent="teal" />
            </Section>

            <Section id="api" eyebrow="03" title="Backend API">
              <p className="text-slate-400">
                Every endpoint accepts/returns JSON. Authenticated routes expect{" "}
                <span className="font-mono text-sol-teal">Authorization: Bearer &lt;jwt&gt;</span>.
              </p>
              <CodeBlock code={SNIPPETS.api} language="http" filename="api reference" accent="accent" />
              <CodeBlock code={SNIPPETS.express} language="ts" filename="server.ts" accent="purple" />
            </Section>

            <Section id="zk" eyebrow="04" title="ZK Proofs">
              <p className="text-slate-400">
                Four Groth16 circuits ship in <span className="font-mono text-sol-teal">@sol-login/circuits</span>: reputation threshold, wallet age, sybil nullifier, social ownership. Compiled WASM + zkey are served from{" "}
                <span className="font-mono">/public/circuits</span>.
              </p>
              <CodeBlock code={SNIPPETS.zk} language="tsx" filename="PremiumGate.tsx" accent="teal" />
              <CodeBlock code={SNIPPETS.zkCircuit} language="circom" filename="reputation_threshold.circom" accent="purple" />
            </Section>

            <Section id="types" eyebrow="05" title="Types">
              <CodeBlock code={SNIPPETS.types} language="ts" filename="@sol-login/core/types.ts" accent="accent" />
            </Section>

            <div className="glass-card p-7" data-testid="docs-cta-card">
              <div className="mono-label mb-2">Ready to build?</div>
              <h3 className="font-display text-2xl font-medium tracking-tight">Drop the SDK into your dApp in under 5 minutes.</h3>
              <p className="mt-2 text-slate-400 text-sm">Stuck? File an issue, or DM us — we ship fixes the same day.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Docs;
