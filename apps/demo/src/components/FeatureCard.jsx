import { motion } from "framer-motion";
import CodeBlock from "@/components/CodeBlock";

const FeatureCard = ({ feature, index = 0 }) => {
  const accentColor = feature.accent === "teal" ? "#14F195" : feature.accent === "accent" ? "#00C2FF" : "#9945FF";

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="group relative glass-card glass-card-hover noise overflow-hidden"
      data-testid={`feature-card-${index}`}
    >
      {/* glow */}
      <div
        className="absolute -top-24 -right-24 w-56 h-56 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"
        style={{ background: accentColor }}
      />
      <div className="relative p-6 md:p-7">
        <div className="flex items-center gap-2 mono-label mb-4">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }}
          />
          0{index + 1}
        </div>
        <h3 className="font-display text-xl md:text-2xl font-medium tracking-tight text-white">
          {feature.title}
        </h3>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
        <div className="mt-5">
          <CodeBlock code={feature.code} language="tsx" accent={feature.accent} />
        </div>
      </div>
    </motion.div>
  );
};

export default FeatureCard;
