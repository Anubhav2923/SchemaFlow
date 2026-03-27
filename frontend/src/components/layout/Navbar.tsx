import { Link } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { motion } from "motion/react";
import { Database, Sun, Moon } from "lucide-react";

type Theme = "light" | "dark";

interface NavbarProps {
  theme: Theme;
  onToggle: () => void;
}

export function Navbar({ theme, onToggle }: NavbarProps) {
  const isDark = theme === "dark";

  const navBg = isDark
    ? "rgba(5, 5, 20, 0.75)"
    : "rgba(255, 255, 255, 0.88)";

  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subTextColor = isDark ? "#94a3b8" : "#64748b";
  const shadowColor = isDark
    ? "0 8px 32px rgba(0,0,0,0.5)"
    : "0 8px 32px rgba(0,0,0,0.10)";
  const ringColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const logoGlow = isDark
    ? "0 0 30px rgba(99,102,241,0.7)"
    : "0 0 20px rgba(99,102,241,0.45)";

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      style={{
        background: navBg,
        boxShadow: shadowColor,
        outline: `1px solid ${ringColor}`,
      }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 m-4 rounded-2xl backdrop-blur-xl transition-all duration-300"
    >
      {/* ── LOGO Area ─────────────────────────────────── */}
      <Link to="/" className="flex items-center gap-2.5 group cursor-pointer mr-6">
        <div
          className="w-9 h-9 bg-[color:var(--color-accent-primary)] rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"
          style={{ boxShadow: logoGlow }}
        >
          <Database className="text-white w-5 h-5 drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
        </div>
        <div className="flex flex-col">
          <span
            className="font-display font-bold text-xl tracking-tighter leading-none transition-colors duration-300"
            style={{ color: textColor }}
          >
            SchemaFlow
          </span>
          <span
            className="text-[8px] font-black uppercase tracking-[0.2em] mt-1 transition-colors duration-300"
            style={{ color: subTextColor }}
          >
            Database Architect
          </span>
        </div>
      </Link>

      {/* ── Navigation Links Area ─────────────────────── */}
      <div
        className="hidden md:flex items-center gap-8 text-[11px] font-bold tracking-[0.15em] transition-colors duration-300"
        style={{ color: textColor }}
      >
        <Link to="/" className="hover:!text-indigo-500 hover:scale-105 transition-all duration-300 lg:text-lg transition-colors">Home</Link>
        <Link to="/templates" className="hover:!text-indigo-500 hover:scale-105 transition-all duration-300 lg:text-lg transition-colors">Templates</Link>
        <Link to="/docs" className="hover:!text-indigo-500 hover:scale-105 transition-all duration-300 lg:text-lg transition-colors">Docs</Link>
      </div>

      {/* ── Actions Area ──────────────────────────────── */}
      <div className="flex items-center gap-6">
        {/* Theme Toggle */}
        <button
          onClick={onToggle}
          className="p-2 rounded-xl transition-all hover:bg-black/5"
          aria-label="Toggle theme"
          style={{ color: subTextColor }}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <SignedOut>
          <SignInButton mode="modal">
            <button
              className="hidden sm:block text-[11px] font-bold tracking-[0.1em] transition-all px-2 py-2 hover:text-indigo-500"
              style={{ color: subTextColor }}
            >
              Log in
            </button>
          </SignInButton>
          <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="py-2.5 px-5 bg-indigo-600 text-white rounded-lg text-[11px] font-black tracking-[0.05em] hover:bg-indigo-500 transition-all flex items-center justify-center shadow-lg shadow-indigo-500/30"
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
