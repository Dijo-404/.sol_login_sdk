import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSolLogin } from "@sol-login/react";
import IdentityCard from "@/components/IdentityCard";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PublicProfile = () => {
  const { name } = useParams();
  const { client } = useSolLogin();
  const [identity, setIdentity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    client.resolveIdentity(name)
      .then(id => { setIdentity(id); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [name, client]);

  const share = () => { navigator.clipboard.writeText(window.location.href); toast.success("Profile link copied"); };

  if (loading) {
    return (
      <div className="min-h-[80vh] pt-28 flex items-center justify-center" data-testid="profile-loading">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-sol-purple animate-spin" />
          <p className="mono-label text-slate-400">Resolving <span className="text-sol-teal">{name}</span> from SNS…</p>
        </div>
      </div>
    );
  }

  if (error || !identity) {
    return (
      <div className="min-h-[80vh] pt-28 pb-20 flex items-center justify-center px-6" data-testid="profile-not-found">
        <div className="text-center max-w-md">
          <div className="mono-label mb-3">404</div>
          <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
            <span className="text-gradient-sol">{name}</span> isn't registered.
          </h2>
          <p className="mt-4 text-slate-400">This .sol domain hasn't been claimed via SNS — or isn't registered on {client.network}.</p>
          <Link to="/explore" className="mt-8 inline-flex items-center gap-2 text-sol-teal text-sm font-mono"><ArrowLeft size={13} /> Browse identities</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pt-28 pb-20" data-testid="public-profile-page">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <Link to="/explore" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-mono transition"><ArrowLeft size={13} /> Explore</Link>
          <button onClick={share} className="btn-ghost" data-testid="share-profile-button"><Share2 size={13} /> Share</button>
        </motion.div>

        <IdentityCard identity={identity} />

        {identity.reputation && (
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 glass-card p-7" data-testid="onchain-activity-card">
            <div className="mono-label mb-4">Onchain metrics</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[
                ["DeFi Score", `${Math.round(identity.reputation.breakdown.defi * 100)}%`],
                ["Governance", `${Math.round(identity.reputation.breakdown.governance * 100)}%`],
                ["NFT Score", `${Math.round(identity.reputation.breakdown.nft * 100)}%`],
                ["Domain Age", `${Math.round(identity.reputation.breakdown.domainAge * 36)}mo`],
              ].map(([label, val]) => (
                <div key={label}><div className="font-mono text-2xl text-white">{val}</div><div className="mono-label mt-1">{label}</div></div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }} className="mt-12 text-center">
          <p className="text-xs font-mono text-slate-500">
            Profile resolved live via <span className="text-sol-teal">SNS Protocol</span> on <span className="text-sol-purple">{client.network}</span> · powered by{" "}
            <Link to="/" className="text-sol-purple hover:text-white transition">.sol Login SDK</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default PublicProfile;
