import { Link } from "react-router-dom";
import { useSolLogin } from "@sol-login/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { LogOut, ChevronDown, User, Layers } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const IdentityBadge = ({ identity }) => {
  const { logout } = useSolLogin();
  const { disconnect } = useWallet();
  const navigate = useNavigate();
  const handle = identity.domain ?? `${identity.wallet.slice(0, 4)}…${identity.wallet.slice(-4)}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] hover:border-white/20 transition-all outline-none" data-testid="identity-badge">
        <div className="relative">
          {identity.avatar ? (
            <img src={identity.avatar} alt={handle} className="w-7 h-7 rounded-full object-cover ring-1 ring-white/10" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sol-purple to-sol-teal ring-1 ring-white/10 flex items-center justify-center text-[10px] font-mono text-white">{handle[0]}</div>
          )}
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-sol-teal ring-2 ring-navy-950" />
        </div>
        <span className="font-mono text-xs text-white">{handle}</span>
        <ChevronDown size={13} className="text-slate-400 group-hover:text-white transition" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-navy-900/95 backdrop-blur-xl border-white/10 text-white min-w-[220px]">
        <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Signed in as</DropdownMenuLabel>
        <div className="px-2 pb-2">
          <div className="text-sm font-medium">{identity.domain || handle}</div>
          <div className="text-[11px] font-mono text-slate-500">{identity.wallet.slice(0, 4)}…{identity.wallet.slice(-4)}</div>
        </div>
        <DropdownMenuSeparator className="bg-white/5" />
        <DropdownMenuItem onClick={() => navigate("/dashboard")} className="text-slate-300 focus:text-white focus:bg-white/[0.06] cursor-pointer" data-testid="identity-menu-dashboard">
          <Layers size={14} className="mr-2" /> Dashboard
        </DropdownMenuItem>
        {identity.domain && (
          <DropdownMenuItem onClick={() => navigate(`/${identity.domain}`)} className="text-slate-300 focus:text-white focus:bg-white/[0.06] cursor-pointer" data-testid="identity-menu-profile">
            <User size={14} className="mr-2" /> Public profile
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="bg-white/5" />
        <DropdownMenuItem onClick={() => { logout(); disconnect().catch(() => {}); toast("Session ended"); navigate("/"); }} className="text-slate-300 focus:text-white focus:bg-white/[0.06] cursor-pointer" data-testid="identity-menu-logout">
          <LogOut size={14} className="mr-2" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default IdentityBadge;
