import { useState } from "react";
import { Link } from "react-router-dom";
import { useSolLogin } from "@sol-login/react";
import IdentityCard from "@/components/IdentityCard";
import ReputationMeter from "@/components/ReputationMeter";
import ZkProofModal from "@/components/ZkProofModal";
import SolLoginButton from "@/components/SolLoginButton";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CREDENTIAL_LABELS, REPUTATION_WEIGHTS } from "@sol-login/core";
import { Shield, ExternalLink } from "lucide-react";

const ProofCTA = ({ type, threshold, label, available, identity }) => {
  const { requestProof } = useSolLogin();
  const has = identity.credentials.some((c) => c.type === type);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`group glass-card p-5 transition-all ${has ? "border-sol-teal/30" : "hover:border-white/20"}`}
      data-testid={`proof-cta-${type}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mono-label flex items-center gap-2 mb-1.5">
            <Shield
              size={11}
              className={has ? "text-sol-teal" : "text-slate-500"}
            />
            {label}
          </div>
          <p className="font-display text-base text-white tracking-tight">
            {threshold ? `Prove ≥ ${threshold}` : "Prove uniqueness"}
          </p>
        </div>
        {has ? (
          <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-sol-teal/10 text-sol-teal border border-sol-teal/30">
            HELD
          </span>
        ) : (
          <button
            onClick={() => requestProof({ type, threshold })}
            disabled={!available}
            className="text-[11px] font-mono px-3 py-1.5 rounded-md bg-white/[0.06] hover:bg-sol-purple/20 hover:text-sol-purple text-slate-300 border border-white/10 hover:border-sol-purple/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
            data-testid={`generate-proof-${type}`}
          >
            Generate proof
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-slate-400 leading-relaxed">
        {type === "reputation_threshold" &&
          "ZK-prove your score exceeds threshold without revealing it."}
        {type === "wallet_age" &&
          "Verify wallet age without revealing your first transaction."}
        {type === "sybil_nullifier" &&
          "Per-app uniqueness via Poseidon nullifier."}
        {type === "social_ownership" &&
          "Prove a linked social belongs to you, blind."}
      </p>
    </motion.div>
  );
};

const Dashboard = () => {
  const { identity } = useSolLogin();
  const [privacy, setPrivacy] = useState({
    showReputation: true,
    showSocials: true,
    showCredentials: true,
  });

  if (!identity) {
    return (
      <div
        className="min-h-[80vh] flex items-center justify-center px-6 pt-24 pb-12"
        data-testid="dashboard-empty"
      >
        <div className="text-center max-w-md">
          <div className="mono-label mb-4">Dashboard locked</div>
          <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
            Sign in to view your{" "}
            <span className="text-gradient-sol">.sol identity</span>
          </h2>
          <p className="mt-4 text-slate-400">
            Connect your wallet to resolve your .sol domain, view your
            reputation, and manage ZK credentials.
          </p>
          <div className="mt-7 inline-flex">
            <SolLoginButton size="lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pt-28 pb-20" data-testid="dashboard-page">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="mono-label mb-2">Your identity</div>
            <h1 className="font-display text-4xl md:text-5xl tracking-tight font-medium">
              gm, <span className="text-gradient-sol">{identity.domain}</span>
            </h1>
          </div>
          <Link
            to={`/${identity.domain}`}
            className="btn-ghost"
            data-testid="view-public-profile-link"
          >
            View public profile <ExternalLink size={13} />
          </Link>
        </div>

        <IdentityCard identity={identity} />

        <Tabs defaultValue="reputation" className="mt-10">
          <TabsList
            className="bg-white/[0.03] border border-white/10 p-1 h-auto"
            data-testid="dashboard-tabs"
          >
            <TabsTrigger
              value="reputation"
              className="font-mono text-xs px-4 py-2 data-[state=active]:bg-white/[0.06] data-[state=active]:text-white text-slate-400"
              data-testid="tab-reputation"
            >
              Reputation
            </TabsTrigger>
            <TabsTrigger
              value="credentials"
              className="font-mono text-xs px-4 py-2 data-[state=active]:bg-white/[0.06] data-[state=active]:text-white text-slate-400"
              data-testid="tab-credentials"
            >
              ZK Credentials
            </TabsTrigger>
            <TabsTrigger
              value="privacy"
              className="font-mono text-xs px-4 py-2 data-[state=active]:bg-white/[0.06] data-[state=active]:text-white text-slate-400"
              data-testid="tab-privacy"
            >
              Privacy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reputation" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-card p-7 md:col-span-1 flex flex-col items-center justify-center">
                <ReputationMeter score={identity.reputation.total} size={180} />
                <p className="mt-4 mono-label">/ 1000 max</p>
              </div>
              <div className="glass-card p-7 md:col-span-2">
                <div className="mono-label mb-5">Score breakdown</div>
                <div className="space-y-4">
                  {Object.entries(identity.reputation.breakdown).map(
                    ([key, val]) => {
                      const weight = REPUTATION_WEIGHTS[key] ?? 0;
                      const contribution = Math.round(val * weight * 1000);
                      return (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4 }}
                          data-testid={`reputation-row-${key}`}
                        >
                          <div className="flex items-baseline justify-between mb-1.5">
                            <span className="font-mono text-xs text-slate-300 capitalize">
                              {key.replace(/([A-Z])/g, " $1")}
                            </span>
                            <span className="font-mono text-xs text-white">
                              {contribution}{" "}
                              <span className="text-slate-500">
                                / {Math.round(weight * 1000)}
                              </span>
                            </span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${val * 100}%` }}
                              transition={{
                                duration: 1.2,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              className="h-full rounded-full"
                              style={{
                                background:
                                  "linear-gradient(90deg, #9945FF 0%, #00C2FF 50%, #14F195 100%)",
                                boxShadow:
                                  "0 0 12px -2px rgba(153, 69, 255, 0.6)",
                              }}
                            />
                          </div>
                        </motion.div>
                      );
                    },
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="credentials" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ProofCTA
                type="reputation_threshold"
                threshold={500}
                label="Reputation Threshold"
                available
                identity={identity}
              />
              <ProofCTA
                type="wallet_age"
                threshold={24}
                label="Wallet Age (24mo)"
                available
                identity={identity}
              />
              <ProofCTA
                type="sybil_nullifier"
                label="Sybil Resistance"
                available
                identity={identity}
              />
              <ProofCTA
                type="social_ownership"
                label="Social Ownership"
                available
                identity={identity}
              />
            </div>
            <div className="mt-6 glass-card p-6">
              <div className="mono-label mb-4">Verified onchain</div>
              {identity.credentials.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No credentials issued yet. Generate a proof above.
                </p>
              ) : (
                <div className="divide-y divide-white/5">
                  {identity.credentials.map((c, i) => {
                    const meta = CREDENTIAL_LABELS[c.type];
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-sol-teal/10 border border-sol-teal/30 flex items-center justify-center text-sol-teal">
                            <Shield size={13} />
                          </div>
                          <div>
                            <div className="text-sm text-white">
                              {meta?.label || c.type}
                            </div>
                            <div className="font-mono text-[11px] text-slate-500">
                              tx: {c.txSignature} ·{" "}
                              {new Date(
                                c.verifiedAt * 1000,
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        {c.threshold && (
                          <span className="font-mono text-xs text-sol-teal">
                            ≥ {c.threshold}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="privacy" className="mt-6">
            <div className="glass-card p-7">
              <div className="mono-label mb-5">Public profile visibility</div>
              <div className="space-y-4">
                {[
                  {
                    key: "showReputation",
                    label: "Show reputation score",
                    desc: "Display your aggregate score on /[name].sol",
                  },
                  {
                    key: "showSocials",
                    label: "Show linked socials",
                    desc: "Show Twitter, GitHub, Discord, Farcaster handles",
                  },
                  {
                    key: "showCredentials",
                    label: "Show ZK credentials",
                    desc: "Surface your verified onchain credentials",
                  },
                ].map((row) => (
                  <div
                    key={row.key}
                    className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                  >
                    <div>
                      <div className="text-sm text-white">{row.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {row.desc}
                      </div>
                    </div>
                    <Switch
                      checked={privacy[row.key]}
                      onCheckedChange={(v) =>
                        setPrivacy((p) => ({ ...p, [row.key]: v }))
                      }
                      data-testid={`privacy-toggle-${row.key}`}
                      className="data-[state=checked]:bg-sol-teal"
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ZkProofModal />
    </div>
  );
};

export default Dashboard;
