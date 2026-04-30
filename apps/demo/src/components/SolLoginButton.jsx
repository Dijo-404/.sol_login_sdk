import { useSolLogin } from "@sol-login/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const SolLoginButton = ({
  size = "md", full = false, redirectOnLogin = false, label = "Sign in with .sol"
}) => {
  const { identity, login, isConnecting } = useSolLogin();
  const { publicKey, signMessage, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const navigate = useNavigate();

  const handleClick = () => {
    if (identity) return;
    // Open the Solana wallet adapter modal to connect
    setVisible(true);
  };

  // When wallet connects, trigger the SDK login flow
  useEffect(() => {
    if (connected && publicKey && signMessage && !identity && !isConnecting) {
      (async () => {
        try {
          const id = await login(publicKey.toBase58(), signMessage);
          toast.success(`Welcome, ${id.domain || publicKey.toBase58().slice(0, 6)}`, {
            description: "Identity resolved via SNS Protocol",
          });
          if (redirectOnLogin) navigate("/dashboard");
        } catch (err) {
          toast.error("Login failed", { description: err.message });
        }
      })();
    }
  }, [connected, publicKey, signMessage, identity, isConnecting]);

  const padding = size === "sm" ? "px-4 py-2 text-sm" : size === "lg" ? "px-7 py-4 text-base" : "px-5 py-2.5 text-sm";

  return (
    <motion.button
      onClick={handleClick}
      disabled={isConnecting}
      data-testid="sign-in-sol-button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={`group relative inline-flex items-center justify-center gap-2 ${padding} ${full ? "w-full" : ""} font-medium text-navy-950 bg-white rounded-xl overflow-hidden transition-all disabled:opacity-50`}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-sol-purple via-sol-accent to-sol-teal opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <span className="absolute inset-[2px] bg-white rounded-[10px] group-hover:opacity-95" />
      <span className="relative flex items-center gap-2 font-display tracking-tight">
        <Sparkles size={size === "lg" ? 18 : 15} className="text-sol-purple" />
        {isConnecting ? "Resolving identity…" : label}
        {!isConnecting && (
          <ArrowRight size={size === "lg" ? 18 : 15} className="transition-transform group-hover:translate-x-1" />
        )}
      </span>
    </motion.button>
  );
};

export default SolLoginButton;
