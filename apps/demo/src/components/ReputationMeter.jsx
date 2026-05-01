import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const ReputationMeter = ({ score = 0, size = 160, animated = true }) => {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
  const radius = (size - 14) / 2;
  const circumference = 2 * Math.PI * radius;
  const max = 1000;
  const progress = Math.min(score / max, 1);

  useEffect(() => {
    if (!animated) return;
    let start;
    const duration = 1400;
    const anim = (t) => {
      if (!start) start = t;
      const elapsed = t - start;
      const eased = 1 - Math.pow(1 - Math.min(elapsed / duration, 1), 3);
      setDisplayScore(Math.round(eased * score));
      if (elapsed < duration) requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
  }, [score, animated]);

  const tier =
    score >= 900
      ? { label: "Legendary", color: "#14F195" }
      : score >= 750
        ? { label: "Elite", color: "#9945FF" }
        : score >= 500
          ? { label: "Established", color: "#00C2FF" }
          : score >= 300
            ? { label: "Active", color: "#94A3B8" }
            : { label: "New", color: "#475569" };

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      data-testid="reputation-meter"
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient
            id={`rep-grad-${size}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#9945FF" />
            <stop offset="50%" stopColor="#00C2FF" />
            <stop offset="100%" stopColor="#14F195" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={6}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#rep-grad-${size})`}
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - progress) }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: "drop-shadow(0 0 6px rgba(153, 69, 255, 0.5))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono font-medium text-white"
          style={{ fontSize: size * 0.22 }}
          data-testid="reputation-score"
        >
          {displayScore}
        </span>
        <span
          className="text-[9px] font-mono uppercase tracking-[0.25em] mt-0.5"
          style={{ color: tier.color }}
        >
          {tier.label}
        </span>
      </div>
    </div>
  );
};

export default ReputationMeter;
