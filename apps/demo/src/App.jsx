import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { useMemo, useEffect } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { SolLoginProvider } from "@sol-login/react";
import { SolLoginClient } from "@sol-login/core";
import SmoothScroll from "@/lib/SmoothScroll";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import PublicProfile from "@/pages/PublicProfile";
import Explore from "@/pages/Explore";
import Docs from "@/pages/Docs";

import "@solana/wallet-adapter-react-ui/styles.css";

function requireEnv(key) {
  const v = import.meta.env[key];
  if (!v) {
    throw new Error(
      `Missing required env var ${key}. Copy apps/demo/.env.example to apps/demo/.env and set it.`,
    );
  }
  return v;
}

const API_URL = requireEnv("VITE_API_URL");
const SOLANA_NETWORK = requireEnv("VITE_SOLANA_NETWORK");
const RPC_ENDPOINT = requireEnv("VITE_SOLANA_RPC");

function App() {
  useEffect(() => {
    import("@solflare-wallet/metamask-wallet-standard")
      .then((mod) => {
        if (typeof mod.registerWallet === "function") mod.registerWallet();
        else if (typeof mod.default === "function") mod.default();
      })
      .catch(() => {});
  }, []);

  const wallets = useMemo(() => [], []);

  const solLoginClient = useMemo(
    () =>
      new SolLoginClient({
        apiUrl: API_URL,
        network: SOLANA_NETWORK,
      }),
    [],
  );

  return (
    <div className="App relative" data-testid="app-root">
      <ConnectionProvider endpoint={RPC_ENDPOINT}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <BrowserRouter>
              <SolLoginProvider client={solLoginClient}>
                <SmoothScroll>
                  <Navbar />
                  <main className="relative z-10">
                    <Routes>
                      <Route path="/" element={<Landing />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/explore" element={<Explore />} />
                      <Route path="/docs" element={<Docs />} />
                      <Route path="/:name" element={<PublicProfile />} />
                    </Routes>
                  </main>
                  <Footer />
                </SmoothScroll>
              </SolLoginProvider>
            </BrowserRouter>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "rgba(10, 13, 22, 0.9)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#F8FAFC",
            backdropFilter: "blur(20px)",
          },
        }}
      />
    </div>
  );
}

export default App;
