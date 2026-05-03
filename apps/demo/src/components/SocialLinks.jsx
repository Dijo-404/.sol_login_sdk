import { Twitter, Github, MessageCircle, Globe } from "lucide-react";

const ICONS = {
  twitter: Twitter,
  github: Github,
  discord: MessageCircle,
  farcaster: Globe,
};

const SocialLinks = ({ socials = {} }) => {
  const entries = Object.entries(socials).filter(([, v]) => v);
  if (entries.length === 0) {
    return (
      <p className="text-xs font-mono text-slate-500">No socials linked</p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([key, handle]) => {
        const Icon = ICONS[key] || Globe;
        return (
          <div
            key={key}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all"
            data-testid={`social-${key}`}
          >
            <Icon size={12} className="text-slate-400" />
            <span className="font-mono text-[11px] text-slate-300">
              @{handle}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default SocialLinks;
