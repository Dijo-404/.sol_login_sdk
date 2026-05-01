import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useSolLogin } from "@sol-login/react";
import ReputationMeter from "@/components/ReputationMeter";
import { TrendingUp, Loader2, Users } from "lucide-react";

const Explore = () => {
  const { client, identity: currentUser } = useSolLogin();
  const [identities, setIdentities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // Fetch identities from the backend leaderboard endpoint
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const data = await client.getLeaderboard();
        setIdentities(data.identities || []);
      } catch (err) {
        console.error("Leaderboard fetch failed:", err);
        setIdentities([]);
      }
      setLoading(false);
    };
    fetchLeaderboard();
  }, [client, currentUser]); // Re-fetch when user logs in (new identity may appear)

  const tiers = [
    { id: "all", label: "All" },
    { id: "legendary", label: "Legendary", min: 900 },
    { id: "elite", label: "Elite", min: 750, max: 899 },
    { id: "established", label: "Established", min: 500, max: 749 },
  ];

  const result =
    filter === "all"
      ? identities
      : identities.filter((i) => {
          const t = tiers.find((x) => x.id === filter);
          const score = i.reputation?.total || 0;
          return score >= (t?.min ?? 0) && score <= (t?.max ?? 1000);
        });

  return (
    <div className="relative pt-28 pb-20" data-testid="explore-page">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="mono-label mb-3 flex items-center gap-2">
              <TrendingUp size={11} className="text-sol-teal" /> Leaderboard
            </div>
            <h1 className="font-display text-4xl md:text-5xl tracking-tight font-medium">
              Top <span className="text-gradient-sol">.sol</span> identities
            </h1>
            <p className="mt-3 text-slate-400 max-w-md">
              Ranked by aggregate reputation across DeFi, governance, NFT,
              social, and domain age — resolved live from Solana{" "}
              {client.network}.
            </p>
          </div>
          <div
            className="flex flex-wrap gap-1 p-1 rounded-full bg-white/[0.03] border border-white/10"
            data-testid="explore-filters"
          >
            {tiers.map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-mono transition-all ${filter === t.id ? "bg-white/[0.08] text-white" : "text-slate-400 hover:text-white"}`}
                data-testid={`filter-${t.id}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-8 h-8 text-sol-purple animate-spin" />
            <p className="mono-label text-slate-400">Loading leaderboard…</p>
          </div>
        ) : result.length === 0 ? (
          <div className="text-center py-32" data-testid="explore-empty">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 mb-6">
              <Users size={28} className="text-slate-500" />
            </div>
            <h3 className="font-display text-xl font-medium text-white mb-2">
              No identities yet
            </h3>
            <p className="text-slate-400 max-w-sm mx-auto">
              {filter !== "all"
                ? 'No identities match this filter. Try selecting "All".'
                : "Sign in with your wallet to be the first on the leaderboard!"}
            </p>
            {!currentUser && filter === "all" && (
              <Link
                to="/"
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-sm text-white border border-white/10 hover:border-white/30 hover:bg-white/[0.04] transition"
              >
                Go sign in →
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Podium */}
            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
              data-testid="podium"
            >
              {result.slice(0, 3).map((id, i) => (
                <motion.div
                  key={id.wallet}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  className="relative glass-card glass-card-hover noise overflow-hidden"
                  data-testid={`podium-${i + 1}`}
                >
                  <div
                    className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-40"
                    style={{
                      background:
                        i === 0 ? "#9945FF" : i === 1 ? "#14F195" : "#00C2FF",
                    }}
                  />
                  <Link
                    to={`/${id.domain || id.wallet}`}
                    className="block relative p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="font-display text-5xl font-light text-white/15">
                        #{i + 1}
                      </div>
                      {id.reputation && (
                        <ReputationMeter
                          score={id.reputation.total}
                          size={70}
                          animated={false}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {id.avatar ? (
                        <img
                          src={id.avatar}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sol-purple to-sol-teal ring-1 ring-white/10" />
                      )}
                      <div>
                        <div className="font-display text-lg font-medium tracking-tight">
                          {id.domain ||
                            `${id.wallet.slice(0, 6)}…${id.wallet.slice(-4)}`}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {id.wallet.slice(0, 4)}…{id.wallet.slice(-4)}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 mono-label">
                <div className="col-span-1">Rank</div>
                <div className="col-span-4">Identity</div>
                <div className="col-span-2">Score</div>
                <div className="col-span-3">DeFi · Gov · NFT</div>
                <div className="col-span-2 text-right">Credentials</div>
              </div>
              <div className="divide-y divide-white/5">
                {result.map((id, i) => (
                  <motion.div
                    key={id.wallet}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.04 }}
                    className="group"
                    data-testid={`leaderboard-row-${i + 1}`}
                  >
                    <Link
                      to={`/${id.domain || id.wallet}`}
                      className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-white/[0.02] transition-all"
                    >
                      <div className="md:col-span-1 font-mono text-sm text-slate-500 group-hover:text-white">
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <div className="md:col-span-4 flex items-center gap-3">
                        {id.avatar ? (
                          <img
                            src={id.avatar}
                            alt=""
                            className="w-9 h-9 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sol-purple to-sol-teal" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-white">
                            {id.domain ||
                              `${id.wallet.slice(0, 6)}…${id.wallet.slice(-4)}`}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {id.wallet.slice(0, 4)}…{id.wallet.slice(-4)}
                          </div>
                        </div>
                      </div>
                      <div className="md:col-span-2 flex items-center gap-2">
                        <span className="font-mono text-base text-white">
                          {id.reputation?.total || 0}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          /1000
                        </span>
                      </div>
                      <div className="md:col-span-3 flex items-center gap-1.5">
                        {[
                          id.reputation?.breakdown?.defi || 0,
                          id.reputation?.breakdown?.governance || 0,
                          id.reputation?.breakdown?.nft || 0,
                        ].map((v, j) => (
                          <div
                            key={j}
                            className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden"
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${v * 100}%`,
                                background:
                                  j === 0
                                    ? "#9945FF"
                                    : j === 1
                                      ? "#00C2FF"
                                      : "#14F195",
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="md:col-span-2 md:text-right">
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-sol-teal">
                          <span className="w-1.5 h-1.5 rounded-full bg-sol-teal" />
                          {id.credentials?.length || 0} held
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
            <p className="mt-8 text-center text-xs font-mono text-slate-500">
              Reputation computed live from Solana {client.network} · SNS
              Protocol
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Explore;
