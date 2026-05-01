import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { Loader2 } from "lucide-react";

const WALLET_COLORS = {
  phantom: "#AB9FF2",
  solflare: "#FC9965",
  backpack: "#E33E3F",
  glow: "#7B61FF",
  metamask: "#F6851B",
  "metamask (solana)": "#F6851B",
  coinbase: "#0052FF",
  trust: "#3375BB",
};

const WalletPicker = ({ open, onClose, onSelect, isConnecting }) => {
  const { wallets } = useWallet();

  const detected = wallets.filter(
    (w) => w.readyState === "Installed" || w.readyState === "Loadable",
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="bg-navy-900/90 backdrop-blur-2xl border-white/10 text-white max-w-md p-0 overflow-hidden"
        data-testid="wallet-picker-modal"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-sol-purple/10 via-transparent to-sol-teal/10 pointer-events-none" />
        <div className="relative p-7">
          <DialogHeader>
            <div className="mono-label mb-3">Step 1 / 2 — Connect</div>
            <DialogTitle className="font-display text-2xl tracking-tight font-medium">
              Choose a wallet
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm mt-1.5">
              Sign a message — no transaction, no fees. Your .sol identity is
              resolved on connect.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-2">
            {detected.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400">No wallets detected.</p>
                <p className="text-xs text-slate-500 mt-2">
                  Install{" "}
                  <a
                    href="https://phantom.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sol-purple hover:underline"
                  >
                    Phantom
                  </a>
                  ,{" "}
                  <a
                    href="https://solflare.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sol-purple hover:underline"
                  >
                    Solflare
                  </a>
                  , or{" "}
                  <a
                    href="https://metamask.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sol-purple hover:underline"
                  >
                    MetaMask
                  </a>{" "}
                  to get started.
                </p>
              </div>
            )}
            {detected.map((w, i) => {
              const name = w.adapter.name;
              const color = WALLET_COLORS[name.toLowerCase()] || "#9945FF";
              return (
                <motion.button
                  key={name}
                  onClick={() => onSelect(w.adapter.name)}
                  disabled={isConnecting}
                  data-testid={`wallet-option-${name.toLowerCase().replace(/\s+/g, "-")}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.3 }}
                  className="group w-full flex items-center justify-between gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all disabled:opacity-40"
                >
                  <div className="flex items-center gap-3.5">
                    {w.adapter.icon ? (
                      <img
                        src={w.adapter.icon}
                        alt={name}
                        className="w-10 h-10 rounded-lg"
                      />
                    ) : (
                      <div
                        className="relative w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold text-base text-white"
                        style={{
                          background: `linear-gradient(135deg, ${color}, ${color}99)`,
                          boxShadow: `0 0 24px -4px ${color}80`,
                        }}
                      >
                        {name[0]}
                      </div>
                    )}
                    <div className="text-left">
                      <div className="font-medium text-white">{name}</div>
                      <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                        {w.readyState === "Installed"
                          ? "Detected"
                          : "Available"}
                      </div>
                    </div>
                  </div>
                  {isConnecting ? (
                    <Loader2
                      size={16}
                      className="text-slate-400 animate-spin"
                    />
                  ) : (
                    <span className="font-mono text-xs text-slate-500 group-hover:text-sol-teal transition">
                      →
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          <div className="mt-6 pt-5 border-t border-white/5">
            <p className="text-[11px] font-mono text-slate-500 leading-relaxed">
              By connecting, you agree to sign an Ed25519 challenge message.
              .sol Login never broadcasts a transaction during sign-in.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletPicker;
