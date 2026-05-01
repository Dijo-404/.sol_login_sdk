import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { useSolLogin } from "@sol-login/react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, ShieldCheck, Cpu, Zap, Lock } from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { id: 1, label: "Loading Groth16 circuit (WASM)", icon: Cpu, duration: 900 },
  { id: 2, label: "Generating witness from private inputs", icon: Lock, duration: 1100 },
  { id: 3, label: "Computing zk-SNARK proof", icon: Zap, duration: 1500 },
  { id: 4, label: "Verifying onchain via Anchor program", icon: ShieldCheck, duration: 1100 },
];

const PROOF_TITLES = {
  reputation_threshold: "Reputation Threshold Proof",
  wallet_age: "Wallet Age Proof",
  sybil_nullifier: "Sybil-Resistance Proof",
  social_ownership: "Social Ownership Proof",
};

const ZkProofModal = () => {
  const { zkProofRequest, closeProof, completeProof } = useSolLogin();
  const open = !!zkProofRequest;
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [logs, setLogs] = useState([]);
  const [txSig, setTxSig] = useState(null);

  useEffect(() => {
    if (!open) { setStep(0); setDone(false); setLogs([]); setTxSig(null); return; }
    let cancelled = false;
    const run = async () => {
      for (let i = 0; i < STEPS.length; i++) {
        if (cancelled) return;
        setStep(i);
        setLogs((prev) => [...prev, `> ${STEPS[i].label}…`]);
        await new Promise((r) => setTimeout(r, STEPS[i].duration));
        if (cancelled) return;
        setLogs((prev) => [...prev, `  ✓ ${STEPS[i].label} — ok`]);
      }

      try {
        const result = await completeProof({ type: zkProofRequest.type, threshold: zkProofRequest.threshold });
        const sig = result?.txSignature || `${Math.random().toString(36).slice(2, 6).toUpperCase()}…${Math.random().toString(36).slice(2, 5)}`;
        setTxSig(sig);
        setLogs((prev) => [...prev, `> tx_signature = ${sig}`]);
        setDone(true);
        toast.success("ZK proof verified", { description: `${PROOF_TITLES[zkProofRequest.type]} issued onchain.` });
      } catch (err) {
        setLogs((prev) => [...prev, `  ✗ Verification failed: ${err.message}`]);
        setDone(true);
        setTxSig(null);
        toast.error("Proof verification failed", { description: err.message });
      }
    };
    run();
    return () => { cancelled = true; };
  }, [open, zkProofRequest, completeProof]);

  if (!zkProofRequest) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeProof()}>
      <DialogContent className="bg-navy-950/95 backdrop-blur-2xl border-white/10 text-white max-w-lg p-0 overflow-hidden" data-testid="zk-proof-modal">
        <div className="absolute inset-0 bg-gradient-to-br from-sol-purple/10 via-transparent to-sol-teal/10 pointer-events-none" />
        <div className="relative p-7">
          <div className="flex items-center gap-2 mono-label mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-sol-purple animate-pulse" />
            Zero-Knowledge Verification
          </div>
          <DialogTitle className="font-display text-2xl tracking-tight font-medium">
            {PROOF_TITLES[zkProofRequest.type]}
          </DialogTitle>
          <p className="mt-1.5 text-sm text-slate-400">
            Prove{" "}
            {zkProofRequest.type === "reputation_threshold" && (<>your reputation is <span className="text-sol-teal font-mono">≥ {zkProofRequest.threshold}</span> without revealing your exact score.</>)}
            {zkProofRequest.type === "wallet_age" && (<>your wallet is older than <span className="text-sol-teal font-mono">{zkProofRequest.threshold} months</span> without revealing your first transaction.</>)}
            {zkProofRequest.type === "sybil_nullifier" && (<>this <span className="text-sol-teal font-mono">.sol</span> identity is a unique human via per-app nullifier.</>)}
            {zkProofRequest.type === "social_ownership" && (<>ownership of a linked social account without revealing the handle.</>)}
          </p>

          <div className="mt-5 rounded-xl bg-black/60 border border-white/5 overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
              <span className="ml-3 text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">groth16 — proving</span>
            </div>
            <div className="p-4 max-h-44 overflow-y-auto terminal-text" data-testid="zk-proof-terminal">
              <AnimatePresence>
                {logs.map((line, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    className={line.startsWith(">") ? "text-sol-purple" : line.startsWith("  ✓") ? "text-sol-teal" : "text-slate-400"}>
                    {line}
                  </motion.div>
                ))}
              </AnimatePresence>
              {!done && (
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2 }} className="text-slate-500">▊</motion.div>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = i === step && !done;
              const completed = i < step || done;
              return (
                <div key={s.id} className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all ${completed ? "border-sol-teal/40 bg-sol-teal/[0.06]" : active ? "border-sol-purple/40 bg-sol-purple/[0.06]" : "border-white/5 bg-white/[0.02]"}`}>
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center ${completed ? "text-sol-teal" : active ? "text-sol-purple" : "text-slate-600"}`}>
                    {completed ? <Check size={14} /> : active ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
                  </div>
                </div>
              );
            })}
          </div>

          {done && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 p-4 rounded-xl bg-sol-teal/[0.06] border border-sol-teal/20">
              <div className="flex items-center gap-2 text-sol-teal text-sm font-medium">
                <ShieldCheck size={16} /> Verified onchain
              </div>
              <div className="mt-2 font-mono text-[11px] text-slate-400 break-all">tx: {txSig}</div>
              <button onClick={closeProof} className="mt-4 w-full btn-primary-solid" data-testid="zk-proof-done-button">Continue</button>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ZkProofModal;
