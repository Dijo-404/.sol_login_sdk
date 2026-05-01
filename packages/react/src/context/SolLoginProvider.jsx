import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { SolLoginClient, storeToken, getStoredToken, clearToken, isTokenExpired } from "@sol-login/core";

const SolLoginContext = createContext(null);

/**
 * @sol-login/react — SolLoginProvider
 * Wraps the app and provides identity state, auth methods, and ZK proof lifecycle.
 *
 * @param {Object} props
 * @param {SolLoginClient} props.client - Instance of SolLoginClient
 * @param {React.ReactNode} props.children
 */
export const SolLoginProvider = ({ client, children }) => {
  const [identity, setIdentity] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletPickerOpen, setWalletPickerOpen] = useState(false);
  const [zkProofRequest, setZkProofRequest] = useState(null);

  // Restore session on mount
  useEffect(() => {
    const token = getStoredToken();
    if (token && !isTokenExpired(token)) {
      client.token = token;
      client.me().then(setIdentity).catch(() => { clearToken(); client.token = null; });
    }
  }, [client]);

  const openWalletPicker = useCallback(() => setWalletPickerOpen(true), []);
  const closeWalletPicker = useCallback(() => setWalletPickerOpen(false), []);

  const login = useCallback(async (walletAddress, signMessage) => {
    setIsConnecting(true);
    try {
      // 1. Get challenge from backend
      const { nonce, message } = await client.getChallenge(walletAddress);

      // 2. Sign challenge with wallet
      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessage(messageBytes);

      // 3. Encode signature as base58
      const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
      const sigBase58 = ((bytes) => {
        const digits = [0];
        for (const byte of bytes) {
          let carry = byte;
          for (let j = 0; j < digits.length; j++) { carry += digits[j] << 8; digits[j] = carry % 58; carry = (carry / 58) | 0; }
          while (carry > 0) { digits.push(carry % 58); carry = (carry / 58) | 0; }
        }
        let str = "";
        for (let i = 0; i < bytes.length && bytes[i] === 0; i++) str += ALPHABET[0];
        for (let i = digits.length - 1; i >= 0; i--) str += ALPHABET[digits[i]];
        return str;
      })(signature);

      // 4. Verify with backend → get JWT + identity
      const { token, identity: resolved } = await client.verify(walletAddress, sigBase58);

      // 5. Store session
      storeToken(token);
      setIdentity(resolved);
      setWalletPickerOpen(false);
      return resolved;
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [client]);

  const logout = useCallback(async () => {
    try { await client.logout(); } catch {}
    clearToken();
    client.token = null;
    setIdentity(null);
  }, [client]);

  const requestProof = useCallback((req) => setZkProofRequest(req), []);
  const closeProof = useCallback(() => setZkProofRequest(null), []);

  const completeProof = useCallback(async (proofMeta) => {
    try {
      const result = await client.verifyProof({
        type: proofMeta.type,
        threshold: proofMeta.threshold ?? null,
        proof: null,
        publicSignals: null,
      });
      setIdentity(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          credentials: [...prev.credentials, result.credential],
        };
      });
      return result;
    } catch (err) {
      console.error("Proof verification failed:", err);
      throw err;
    }
  }, [client]);

  const value = useMemo(() => ({
    client, identity, isConnecting, walletPickerOpen, zkProofRequest,
    openWalletPicker, closeWalletPicker, login, logout,
    requestProof, closeProof, completeProof,
  }), [client, identity, isConnecting, walletPickerOpen, zkProofRequest,
    openWalletPicker, closeWalletPicker, login, logout,
    requestProof, closeProof, completeProof]);

  return <SolLoginContext.Provider value={value}>{children}</SolLoginContext.Provider>;
};

export const useSolLogin = () => {
  const ctx = useContext(SolLoginContext);
  if (!ctx) throw new Error("useSolLogin must be used inside SolLoginProvider");
  return ctx;
};
