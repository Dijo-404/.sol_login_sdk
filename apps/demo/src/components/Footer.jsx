import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="relative z-10 border-t border-white/5 mt-24" data-testid="footer">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sol-purple via-sol-accent to-sol-teal" />
              <span className="font-display text-base font-medium tracking-tight">
                <span className="text-white">.sol</span>
                <span className="text-slate-400 ml-1">Login</span>
              </span>
            </Link>
            <p className="mt-5 text-sm text-slate-400 max-w-sm leading-relaxed">
              The identity primitive for Solana. Sign in with your .sol name —
              own your reputation, your socials, your zero-knowledge credentials.
            </p>
            <div className="mt-6 flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em] text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-sol-teal animate-pulse" />
              All systems operational
            </div>
          </div>

          <div>
            <p className="mono-label mb-4">Product</p>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link to="/dashboard" className="hover:text-white transition">Dashboard</Link></li>
              <li><Link to="/explore" className="hover:text-white transition">Explore</Link></li>
              <li><Link to="/docs" className="hover:text-white transition">Documentation</Link></li>
              <li><Link to="/dijo.sol" className="hover:text-white transition">Sample profile</Link></li>
            </ul>
          </div>

          <div>
            <p className="mono-label mb-4">Resources</p>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><span className="hover:text-white transition cursor-pointer">SDK Reference</span></li>
              <li><span className="hover:text-white transition cursor-pointer">ZK Circuits</span></li>
              <li><span className="hover:text-white transition cursor-pointer">Anchor Program</span></li>
              <li><span className="hover:text-white transition cursor-pointer">Architecture</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-mono text-slate-500">
            © 2026 .sol Login SDK. Built for SNS × Frontier Hackathon.
          </p>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
            <span>v0.1.0 • Devnet</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span>MIT License</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
