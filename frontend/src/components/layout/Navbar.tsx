import { Link } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { motion } from "motion/react";
import { Database, Sun, Moon } from "lucide-react";

type Theme = "light" | "dark";

interface NavbarProps {
  theme: Theme;
  onToggle: () => void;
  fullWidth?: boolean;
}

export function Navbar({ theme, onToggle, fullWidth = false }: NavbarProps) {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={
        fullWidth
          ? "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 bg-nebula-950/80 backdrop-blur-xl border-b border-white/5"
          : "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 glass-panel border-b-0 m-4 rounded-2xl bg-nebula-950/40 backdrop-blur-xl"
      }
    >
      {/* ── LOGO Area ─────────────────────────────────── */}
      <Link to="/" className="flex items-center gap-2.5 group cursor-pointer mr-6">
        <div className="w-9 h-9 bg-[color:var(--color-accent-primary)] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 group-hover:rotate-3 transition-transform">
          <Database className="text-white w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-display font-bold text-xl tracking-tighter text-white leading-none">SchemaForge</span>
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">Database Architect</span>
        </div>
      </Link>

      {/* ── Navigation Links Area ─────────────────────── */}
      {!fullWidth && (
        <div className="hidden md:flex items-center gap-8 text-[11px] font-bold tracking-[0.15em] text-slate-400">
          <a href="/#features" className="hover:!text-white hover:scale-105 transition-all duration-300 lg:text-lg">Features</a>
          <a href="/#templates" className="hover:!text-white hover:scale-105 transition-all duration-300 lg:text-lg">Templates</a>
          <Link to="/docs" className="hover:!text-white hover:scale-105 transition-all duration-300 lg:text-lg">Docs</Link>
        </div>
      )}

      {/* ── Actions Area ──────────────────────────────── */}
      <div className="flex items-center gap-6">
        {/* Theme Toggle */}
        <button
          onClick={onToggle}
          className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all"
          aria-label="Toggle theme"
        >
          {theme === "light" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <SignedOut>
          <SignInButton mode="modal">
            <button className="hidden sm:block text-[11px] font-bold tracking-[0.1em] text-slate-400 hover:text-white transition-all px-2 py-2">
              Log in
            </button>
          </SignInButton>
          <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="py-4 px-6 bg-white text-nebula-950 rounded-lg text-[11px] font-black tracking-[0.05em] hover:bg-slate-100 transition-all flex items-center justify-center shadow-lg shadow-white/5"
            >
              Get Started
            </motion.button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "w-9 h-9 rounded-xl border border-white/10",
              },
            }}
            afterSignOutUrl="/"
          />
        </SignedIn>
      </div>
    </motion.nav>
  );
}
