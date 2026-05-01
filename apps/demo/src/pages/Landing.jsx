import { motion } from "framer-motion";
import HeroScene from "@/components/HeroScene";
import SolLoginButton from "@/components/SolLoginButton";
import FeatureCard from "@/components/FeatureCard";
import HowItWorks from "@/components/HowItWorks";
import CodeBlock from "@/components/CodeBlock";
import ZkProofModal from "@/components/ZkProofModal";
import { FEATURES, INTEGRATIONS } from "@sol-login/core";
import { ArrowRight, Github } from "lucide-react";
import { Link } from "react-router-dom";

const QUICKSTART = `import { SolLoginProvider, SolLoginButton, useSolLogin } from '@sol-login/react'

export default function App() {
  return (
    <SolLoginProvider apiUrl="https://api.sollogin.id">
      <Page />
    </SolLoginProvider>
  )
}

function Page() {
  const { identity } = useSolLogin()
  if (!identity) return <SolLoginButton />
  return <h1>gm, {identity.domain} ✦</h1>
}`;

const Landing = () => {
  return (
    <>
      {/* HERO */}
      <section
        className="relative min-h-[100vh] flex items-center overflow-hidden"
        data-testid="landing-hero"
      >
        <div className="absolute inset-0 grid-bg" />
        <HeroScene />

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full pt-20">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="glass-pill mb-7"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sol-teal animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-slate-300">
                SNS × Frontier Hackathon · Live on Devnet
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="font-display text-5xl md:text-7xl lg:text-[88px] tracking-[-0.04em] font-medium leading-[0.92]"
            >
              Sign in with your{" "}
              <span className="text-gradient-sol animate-gradient-x [background-size:200%]">
                .sol
              </span>{" "}
              name.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-7 text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed"
            >
              The drop-in identity primitive for Solana. Replace raw wallet
              connection with a human-readable, reputation-carrying,
              ZK-verifiable identity layer — owned by the user.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              <SolLoginButton
                size="lg"
                redirectOnLogin
                label="Try the live demo"
              />
              <Link
                to="/docs"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-mono text-sm text-white border border-white/10 hover:border-white/30 hover:bg-white/[0.04] transition"
                data-testid="hero-docs-link"
              >
                <Github size={15} /> Read the docs <ArrowRight size={14} />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3"
            >
              {[
                ["3 lines", "to integrate"],
                ["<200ms", "to resolve"],
                ["Groth16", "ZK proofs"],
                ["MIT", "open source"],
              ].map((stat, i) => (
                <div key={i} className="flex items-baseline gap-2">
                  <span className="font-mono font-medium text-white text-base">
                    {stat[0]}
                  </span>
                  <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-slate-500">
                    {stat[1]}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll cue */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500"
        >
          <span className="mono-label text-[10px]">scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-slate-500 to-transparent" />
        </motion.div>
      </section>

      {/* INTEGRATIONS */}
      <section
        className="relative py-16 border-y border-white/5"
        data-testid="integrations-strip"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="mono-label text-center mb-7">
            Powered by the Solana ecosystem
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
            {INTEGRATIONS.map((it, i) => (
              <motion.div
                key={it.name}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="group flex items-center gap-2"
                data-testid={`integration-${it.name.toLowerCase().replace(" ", "-")}`}
              >
                <span className="font-display text-lg md:text-xl font-medium text-slate-500 group-hover:text-white transition tracking-tight">
                  {it.name}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative py-28" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="max-w-2xl mb-14">
            <div className="mono-label mb-3">What's in the box</div>
            <h2 className="font-display text-4xl md:text-5xl tracking-tight font-medium">
              An entire identity stack,{" "}
              <span className="text-gradient-sol">three lines</span> to install.
            </h2>
            <p className="mt-4 text-slate-400 max-w-lg">
              Auth, identity resolution, reputation scoring, ZK credentials, and
              Sybil resistance — all composable, all open source.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} feature={f} index={i} />
            ))}
          </div>
        </div>
      </section>

      <HowItWorks />

      {/* QUICKSTART */}
      <section className="relative py-28" data-testid="quickstart-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="mono-label mb-3">Quickstart</div>
              <h2 className="font-display text-4xl md:text-5xl tracking-tight font-medium leading-[1.05]">
                Install. Wrap. <br />
                <span className="text-gradient-sol">Ship</span>.
              </h2>
              <p className="mt-5 text-slate-400 max-w-md">
                Three packages:{" "}
                <span className="font-mono text-sol-teal">@sol-login/core</span>
                ,{" "}
                <span className="font-mono text-sol-teal">
                  @sol-login/react
                </span>
                ,{" "}
                <span className="font-mono text-sol-teal">
                  @sol-login/express
                </span>
                . Drop in the button, read identity from the hook, ship.
              </p>
              <div className="mt-7 space-y-2.5">
                {[
                  "yarn add @sol-login/react @sol-login/core",
                  "Wrap your app in <SolLoginProvider/>",
                  "Drop <SolLoginButton/> anywhere",
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-sol-purple w-6">
                      0{i + 1}
                    </span>
                    <span className="font-mono text-sm text-slate-300">
                      {t}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                to="/docs"
                className="mt-7 inline-flex items-center gap-2 text-sol-teal hover:text-white font-mono text-sm transition group"
              >
                Full SDK reference{" "}
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-1 transition"
                />
              </Link>
            </div>
            <div>
              <CodeBlock
                code={QUICKSTART}
                language="tsx"
                filename="app.tsx"
                accent="teal"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-28" data-testid="cta-section">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="relative glass-card noise overflow-hidden">
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-sol-purple/30 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-sol-teal/30 blur-3xl pointer-events-none" />
            <div className="relative p-10 md:p-16 text-center">
              <div className="mono-label mb-4">Ready to ship?</div>
              <h2 className="font-display text-4xl md:text-5xl tracking-tight font-medium leading-tight">
                One identity. <br />
                Every Solana app.
              </h2>
              <p className="mt-5 text-slate-400 max-w-md mx-auto">
                Try the live demo, then drop the SDK into your dApp in under
                five minutes.
              </p>
              <div className="mt-8 inline-flex items-center justify-center">
                <SolLoginButton size="lg" redirectOnLogin />
              </div>
            </div>
          </div>
        </div>
      </section>

      <ZkProofModal />
    </>
  );
};

export default Landing;
