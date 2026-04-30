import { Link, NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import SolLoginButton from "@/components/SolLoginButton";
import { useSolLogin } from "@sol-login/react";
import IdentityBadge from "@/components/IdentityBadge";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/explore", label: "Explore" },
  { to: "/docs", label: "Docs" },
];

const Navbar = () => {
  const { identity } = useSolLogin();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-navy-950/70 backdrop-blur-xl border-b border-white/5" : "bg-transparent"}`}
      data-testid="navbar"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group" data-testid="navbar-logo">
          <div className="relative">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sol-purple via-sol-accent to-sol-teal" />
            <div className="absolute inset-0 w-7 h-7 rounded-lg bg-gradient-to-br from-sol-purple to-sol-teal opacity-50 blur-md group-hover:opacity-100 transition" />
          </div>
          <span className="font-display text-[15px] font-medium tracking-tight">
            <span className="text-white">.sol</span><span className="text-slate-400 ml-1">Login</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} data-testid={`nav-link-${item.label.toLowerCase()}`}
              className={({ isActive }) => `px-4 py-1.5 rounded-full text-[13px] font-mono transition-all ${isActive ? "text-white bg-white/[0.06] border border-white/10" : "text-slate-400 hover:text-white border border-transparent"}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-2">
          {identity ? <IdentityBadge identity={identity} /> : <SolLoginButton size="sm" />}
        </div>
        <button onClick={() => setMobileOpen((v) => !v)} className="md:hidden text-white p-2" data-testid="navbar-mobile-toggle" aria-label="Toggle menu">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {mobileOpen && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="md:hidden border-t border-white/5 bg-navy-950/95 backdrop-blur-xl" data-testid="navbar-mobile-menu">
          <div className="px-6 py-5 flex flex-col gap-2">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className="px-3 py-2.5 rounded-lg text-sm font-mono text-slate-300 hover:text-white hover:bg-white/[0.04]">{item.label}</NavLink>
            ))}
            <div className="mt-3">
              {identity ? <IdentityBadge identity={identity} /> : <SolLoginButton size="sm" full />}
            </div>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
};

export default Navbar;
