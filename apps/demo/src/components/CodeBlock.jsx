import { useState } from "react";
import { Copy, Check } from "lucide-react";

const CodeBlock = ({ code, language = "tsx", filename, accent = "purple" }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const accentColor =
    accent === "teal" ? "#14F195" : accent === "accent" ? "#00C2FF" : "#9945FF";

  return (
    <div
      className="relative rounded-xl bg-black/50 border border-white/5 overflow-hidden group"
      data-testid="code-block"
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          {filename && (
            <span className="ml-3 text-[11px] font-mono text-slate-500">
              {filename}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-mono uppercase tracking-[0.2em]"
            style={{ color: accentColor }}
          >
            {language}
          </span>
          <button
            onClick={handleCopy}
            className="p-1 text-slate-500 hover:text-white transition opacity-0 group-hover:opacity-100"
            data-testid="code-copy-button"
            aria-label="Copy"
          >
            {copied ? (
              <Check size={12} className="text-sol-teal" />
            ) : (
              <Copy size={12} />
            )}
          </button>
        </div>
      </div>
      <pre className="p-4 overflow-x-auto terminal-text">
        <code className="text-slate-300 whitespace-pre">{code}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
