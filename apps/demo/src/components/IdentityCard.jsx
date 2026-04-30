import { motion } from "framer-motion";
import SocialLinks from "@/components/SocialLinks";
import ReputationMeter from "@/components/ReputationMeter";
import { CREDENTIAL_LABELS } from "@sol-login/core";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

const IdentityCard = ({ identity, compact = false }) => {
  const [copied, setCopied] = useState(false);

  const copyWallet = () => {
    navigator.clipboard.writeText(identity.wallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative glass-card noise overflow-hidden"
      data-testid="identity-card"
    >
      {/* gradient sheen */}
      <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full bg-sol-purple/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-72 h-72 rounded-full bg-sol-teal/15 blur-3xl pointer-events-none" />

      <div className="relative p-7 md:p-9">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="mono-label flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-sol-teal animate-pulse" />
            Verified Identity
          </div>
          <div className="mono-label text-slate-500">SNS Protocol</div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sol-purple to-sol-teal blur-xl opacity-50" />
            {identity.avatar ? (
              <img src={identity.avatar} alt={identity.domain} className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover ring-1 ring-white/20" data-testid="identity-avatar" />
            ) : (
              <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-sol-purple to-sol-teal ring-1 ring-white/20 flex items-center justify-center text-3xl font-display font-bold text-white" data-testid="identity-avatar">
                {(identity.domain || identity.wallet)?.[0]?.toUpperCase() || "?"}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-display text-3xl md:text-4xl tracking-tight font-medium text-white" data-testid="identity-domain">
              {identity.domain}
            </h2>
            {identity.displayName && (
              <p className="text-slate-400 mt-1">{identity.displayName}</p>
            )}
            {identity.bio && !compact && (
              <p className="text-sm text-slate-400 mt-3 max-w-md leading-relaxed">{identity.bio}</p>
            )}

            <button
              onClick={copyWallet}
              className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-all"
              data-testid="copy-wallet-button"
            >
              <span className="font-mono text-[11px] text-slate-400">
                {identity.wallet.slice(0, 6)}…{identity.wallet.slice(-6)}
              </span>
              {copied ? (
                <Check size={12} className="text-sol-teal" />
              ) : (
                <Copy size={12} className="text-slate-500" />
              )}
            </button>
          </div>

          {identity.reputation && (
            <div className="md:ml-auto">
              <ReputationMeter score={identity.reputation.total} size={130} />
            </div>
          )}
        </div>

        {!compact && (
          <>
            <div className="mt-7 pt-6 border-t border-white/5">
              <p className="mono-label mb-3">Linked Socials</p>
              <SocialLinks socials={identity.socials} />
            </div>

            {identity.credentials?.length > 0 && (
              <div className="mt-7 pt-6 border-t border-white/5">
                <p className="mono-label mb-3">ZK Credentials Held</p>
                <div className="flex flex-wrap gap-2">
                  {identity.credentials.map((c, i) => {
                    const meta = CREDENTIAL_LABELS[c.type];
                    return (
                      <div
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono border border-sol-teal/30 text-sol-teal bg-sol-teal/[0.06]"
                        style={{ boxShadow: "0 0 16px -6px rgba(20, 241, 149, 0.4)" }}
                        data-testid={`credential-${c.type}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-sol-teal" />
                        {meta?.label || c.type}
                        {c.threshold && <span className="text-sol-teal/70">≥{c.threshold}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default IdentityCard;
