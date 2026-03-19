import { Link } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { Button } from "../ui/Button";

type Theme = "light" | "dark";

interface NavbarProps {
  theme: Theme;
  onToggle: () => void;
  fullWidth?: boolean;
}

export function Navbar({ theme, onToggle, fullWidth = false }: NavbarProps) {
  return (
    <nav className={`sticky top-0 z-[60] w-full border-b transition-all duration-300 ${
      theme === 'dark' 
        ? "border-[#334155] bg-[#020617]/95 backdrop-blur-xl" 
        : "border-[#e2e8f0] bg-white/95 backdrop-blur-xl"
    }`}>
      <div className={`flex h-16 items-stretch justify-between w-full px-8`}>
        {/* Logo Container - Aligned with Sidebar */}
        <div className={`flex items-center border-r border-transparent w-80 px-4 md:px-6`}>
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#6366f1,#4f46e5)] text-white shadow-lg transition-transform group-hover:scale-105 group-hover:rotate-3 shadow-indigo-500/30">
              <span className="text-base font-black tracking-tighter">SF</span>
            </div>
            <div className="flex flex-col min-w-0 px-1">
              <span className={`text-[17px] font-extrabold leading-none tracking-tight truncate font-['Plus_Jakarta_Sans'] ${theme === 'dark' ? 'text-white' : 'text-[#0f172a]'}`}>
                Schema Forge
              </span>
              <span className="mt-1.5 text-[9px] uppercase tracking-[0.22em] font-black text-[#94a3b8] truncate opacity-90">
                DATABASE ARCHITECT
              </span>
            </div>
          </Link>
        </div>

        {/* Action Area */}
        <div className={`flex items-center justify-end gap-5 ${fullWidth ? 'flex-1 px-5' : 'flex-1'} `}>
          <button
            onClick={onToggle}
            className={`group relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300 ${
              theme === 'dark'
                ? "border-[#334155] bg-[#0f172a] text-indigo-300 hover:border-indigo-400 hover:bg-[#1e293b]"
                : "border-[#e2e8f0] bg-white text-amber-500 hover:border-indigo-200 hover:bg-slate-50"
            }`}
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.364 17.636l-.707.707M17.636 17.636l.707.707M6.364 6.364l.707.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" className="hidden sm:inline-flex h-10 rounded-xl px-4 text-[10px] uppercase font-black tracking-widest text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-all">
                Login
              </Button>
            </SignInButton>
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
              <Button variant="primary" className="hidden sm:inline-flex h-10 rounded-xl px-7 shadow-xl shadow-indigo-500/20 bg-indigo-500 hover:bg-indigo-600 border-none font-black text-[10px] uppercase tracking-widest transition-transform hover:scale-105 active:scale-95">
                Get Started
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}
