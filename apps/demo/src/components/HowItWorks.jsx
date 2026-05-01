import { motion } from "framer-motion";

const STEPS = [
  {
    n: "01",
    title: "Connect wallet",
    desc: "User clicks <SolLoginButton/>. SDK initiates an Ed25519 challenge. No transaction, no fees.",
    side: "client",
  },
  {
    n: "02",
    title: "Resolve .sol via SNS",
    desc: "Backend resolves the wallet to its primary .sol domain, pulls SNS records (avatar, socials).",
    side: "server",
  },
  {
    n: "03",
    title: "Aggregate reputation",
    desc: "Indexer computes reputation 0–1000 across DeFi, governance, NFT, and domain age.",
    side: "server",
  },
  {
    n: "04",
    title: "Generate ZK proof",
    desc: "Browser runs Groth16 over private reputation. Only public threshold + commitment exit the device.",
    side: "client",
  },
  {
    n: "05",
    title: "Verify onchain",
    desc: "Anchor program validates the Groth16 proof and emits a verified-credential event.",
    side: "chain",
  },
  {
    n: "06",
    title: "Issue session JWT",
    desc: "Backend signs a JWT bound to wallet + .sol + verified credentials. Drop into any dApp.",
    side: "server",
  },
];

const HowItWorks = () => {
  return (
    <section className="relative py-28" data-testid="how-it-works">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="max-w-2xl">
          <div className="mono-label mb-3">How it works</div>
          <h2 className="font-display text-4xl md:text-5xl tracking-tight font-medium text-white">
            Six steps from wallet to{" "}
            <span className="text-gradient-sol">verified identity</span>.
          </h2>
          <p className="mt-4 text-slate-400 max-w-lg">
            The entire flow is open-source and runs on Solana Devnet. Every step
            is replaceable: bring your own indexer, your own circuits, your own
            UI.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="relative glass-card glass-card-hover p-6 group"
              data-testid={`how-step-${i + 1}`}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="font-display text-3xl font-light text-white/15 group-hover:text-white/25 transition">
                  {s.n}
                </span>
                <span
                  className={`mono-label px-2 py-1 rounded-md ${
                    s.side === "client"
                      ? "text-sol-purple bg-sol-purple/10 border border-sol-purple/20"
                      : s.side === "server"
                        ? "text-sol-accent bg-sol-accent/10 border border-sol-accent/20"
                        : "text-sol-teal bg-sol-teal/10 border border-sol-teal/20"
                  }`}
                >
                  {s.side}
                </span>
              </div>
              <h3 className="font-display text-lg font-medium text-white tracking-tight">
                {s.title}
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                {s.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
