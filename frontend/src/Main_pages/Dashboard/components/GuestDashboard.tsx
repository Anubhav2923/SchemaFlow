import type { Dispatch, FormEvent, SetStateAction } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Database, Layout, Code, ArrowRight, Cpu } from "lucide-react";
import { SignInButton } from "@clerk/clerk-react";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { TiltedCard } from "../../../components/ui/TiltedCard";

/* ─── Props ─────────────────────────────────────────── */
interface GuestDashboardProps {
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  description: string;
  setDescription: Dispatch<SetStateAction<string>>;
  isPending: boolean;
}

/* ─── Data ───────────────────────────────────────────── */
const FEATURES = [
  {
    icon: <Database className="w-6 h-6 text-[color:var(--color-accent-cyan)]" />,
    title: "Visual Relationships",
    description: "Connect tables visually with automatic handle management and foreign key enforcement.",
  },
  {
    icon: <Layout className="w-6 h-6 text-[color:var(--color-accent-primary)]" />,
    title: "Visual Workspace",
    description: "High-performance interactive canvas for tables, columns, constraints, and relationships.",
  },
  {
    icon: <Code className="w-6 h-6 text-[color:var(--color-accent-secondary)]" />,
    title: "Import / Export Engine",
    description: "Convert visual diagrams into Prisma, Drizzle, Mongoose, or raw PostgreSQL DDL instantly.",
  },
  {
    icon: <Cpu className="w-6 h-6 text-white" />,
    title: "Template Library",
    description: "Access battle-tested industry schemas for E-commerce, Auth, Social Media, and more.",
  },
];

const ORM_SUPPORTS = ["Prisma", "Drizzle", "Mongoose", "PostgreSQL", "MySQL"];

/* ─── Main Component ─────────────────────────────────── */
export function GuestDashboard({ handleSubmit, name, setName, description, setDescription, isPending }: GuestDashboardProps) {
  return (
    <div className="flex-1 w-full min-h-screen bg-[var(--page-bg)] text-[var(--ink-strong)] overflow-x-hidden selection:bg-[color:var(--color-accent-primary)]/30 transition-colors duration-300">

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section className="relative pt-40 pb-20 px-4 md:px-6 xl:px-10 overflow-hidden">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full h-[600px] nebula-glow-top -z-10" />
        <div className="max-w-[1580px] mx-auto text-center mt-30">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
            }}
          >
            <motion.h1
              variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
              className="text-[4em] md:text-[8rem] xl:text-[8rem] font-bold mb-10 leading-[1] tracking-[-0.08em] dark:text-white text-slate-900 font-display"
              style={{ textRendering: "geometricPrecision", WebkitFontSmoothing: "antialiased" }}
            >
              The Figma for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#22d3ee] filter drop-shadow-[0_0_40px_rgba(99,102,241,0.3)]">
                Database Architecture
              </span>
            </motion.h1>

            <motion.p
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="text-lg md:text-xl dark:text-slate-300 text-slate-700 mb-16 max-w-4xl mx-auto leading-relaxed font-medium"
              style={{ textRendering: "optimizeLegibility", WebkitFontSmoothing: "antialiased" }}
            >
              Bridge the gap between abstract data modeling and production-ready implementation. 
              Visually architect complex schemas with high-performance precision.
            </motion.p>

            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-8 py-4 bg-[#6366f1] text-white rounded-2xl font-bold text-lg hover:shadow-[0_0_60px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-2 group"
                >
                  Start Building Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </SignInButton>

              <Link
                to="/docs"
                className="w-full sm:w-auto px-10 py-4 glass-panel border-white/5 bg-white/5 text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-all text-center backdrop-blur-xl"
              >
                Read Docs
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-24 relative group"
          >
            <div className="glass-panel rounded-[1.75rem] p-4 shadow-[0_0_120px_rgba(0,0,0,0.2)] dark:shadow-[0_0_120px_rgba(0,0,0,0.6)] overflow-hidden relative z-10 mx-auto max-w-[1440px]">
              <div className="bg-nebula-900 rounded-[1.35rem] aspect-[18/9.7] relative overflow-hidden group/canvas">
                
                {/* Dashboard Screenshot Mockup */}
                <div className="absolute inset-0">
                  <img 
                    src="/dahboard_image.png" 
                    alt="SchemaFlow Workspace Preview" 
                    className="w-full h-full object-cover opacity-90 group-hover/canvas:opacity-100 group-hover/canvas:scale-[1.01] transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-nebula-950 via-transparent to-transparent opacity-40" />
                </div>

                {/* macOS Mockup UI Overlay */}
                <div className="absolute top-6 left-6 flex gap-2.5 z-20">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.3)]" />
                  <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.3)]" />
                  <div className="w-3.5 h-3.5 rounded-full bg-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.3)]" />
                </div>
                <div className="absolute top-6 right-6 z-20">
                  <div className="px-5 py-2 rounded-xl bg-[color:var(--color-accent-primary)]/80 backdrop-blur-md text-white text-[11px] font-black uppercase tracking-[0.25em] shadow-xl border border-white/10">
                    Live Session
                  </div>
                </div>

                {/* Mouse spotlight effect over the image */}
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_var(--mouse-x)_var(--mouse-y),rgba(99,102,241,0.15)_0%,transparent_50%)] opacity-0 group-hover/canvas:opacity-100 transition-opacity" 
                     onMouseMove={(e) => {
                       const rect = e.currentTarget.getBoundingClientRect();
                       const target = e.currentTarget as HTMLElement;
                       target.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                       target.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
                     }}
                />
              </div>
            </div>
            
            <div className="absolute -top-20 -right-20 w-[40rem] h-[40rem] bg-accent-primary/5 blur-[120px] -z-10" />
            <div className="absolute -bottom-20 -left-20 w-[40rem] h-[40rem] bg-accent-cyan/5 blur-[120px] -z-10" />
          </motion.div>
        </div>
      </section>

      {/* ══ FEATURES GRID ════════════════════════════════════ */}
      <section className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-4 tracking-tighter font-display dark:text-white text-slate-900">Engineered for Modern Teams</h2>
            <p className="dark:text-slate-300 text-slate-700 max-w-2xl mx-auto text-lg leading-relaxed font-light">
              SchemaFlow provides a premium workspace focused on clarity, speed, and collaborative intent.
            </p>
          </motion.div>

          <div className="flex  justify-center gap-10">
            {FEATURES.map((f, i) => (
              <TiltedCard
                key={i}
                containerHeight="400px"
                imageHeight="400px"
                imageWidth="350px"
                rotateAmplitude={12}
                scaleOnHover={1.05}
                showTooltip={false}
                displayOverlayContent={true}
                overlayContent={
                  <div className="p-12 h-full flex flex-col glass-panel rounded-[2.5rem] border-white/5 hover:border-white/20 transition-all group relative overflow-hidden backdrop-blur-none">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[color:var(--color-accent-primary)]/5 blur-[50px] -z-10 group-hover:bg-[color:var(--color-accent-primary)]/10 transition-all font-display" />
                    <div className="mb-8 p-4 rounded-2xl bg-white/5 w-fit group-hover:bg-white/10 transition-colors">
                      {f.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-4 font-display text-white">{f.title}</h3>
                    <p className="text-sm dark:text-slate-300 text-slate-700 leading-relaxed font-light">{f.description}</p>
                  </div>
                }
              />
            ))}
          </div>
        </div>
      </section>

      {/* ══ CODE PREVIEW ══════════════════════════════════════ */}
      <section className="py-24 px-6 bg-nebula-900/50 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-accent-primary/5 blur-[100px] -z-10" />
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 font-display text-white">From Visual to <br />Production Code</h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed font-light">
              Stop manually writing boilerplate. SchemaFlow generates type-safe code for your favorite ORMs and raw SQL dialects instantly.
            </p>
            <ul className="space-y-4">
              {ORM_SUPPORTS.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                  <div className="w-5 h-5 rounded-full bg-[color:var(--color-accent-primary)]/20 flex items-center justify-center shadow-lg shadow-accent-primary/10">
                    <div className="w-2 h-2 rounded-full bg-[color:var(--color-accent-primary)]" />
                  </div>
                  {item} Support
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="glass-panel rounded-3xl overflow-hidden border-white/10 shadow-3xl transform rotate-1 hover:rotate-0 transition-transform duration-700"
          >
            <div className="bg-white/5 px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/30" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/30" />
                <div className="w-3 h-3 rounded-full bg-green-500/30" />
              </div>
              <span className="text-[10px] font-mono text-slate-500 tracking-widest font-black">SCHEMA.PRISMA</span>
            </div>
            <div className="p-8 font-mono text-sm overflow-x-auto bg-black/20">
              <pre className="text-[color:var(--color-accent-cyan)] leading-[1.6]">
                <code>{`model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String?
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
}`}
                </code>
              </pre>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ QUICK-START FORM ══════════════════════════════════ */}
      <section id="workspace" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-primary/2 blur-[150px] -z-10" />
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tighter font-display text-white">Ready to build?</h2>
            <p className="text-slate-400 mb-12 text-lg font-light leading-relaxed">
              Create your first workspace and experience the next generation of DB modeling.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass-panel rounded-[2.5rem] p-8 md:p-14 text-left relative overflow-hidden border-white/5"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 px-1">Workspace Name</label>
                <Input
                  placeholder="e.g. Acme API Infrastructure"
                  className="h-16 rounded-2xl bg-white/5 border-white/10 px-6 text-white placeholder:text-slate-600 focus:border-[color:var(--color-accent-primary)]/50 focus:bg-white/10 transition-all font-medium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 px-1">Description</label>
                <Input
                  placeholder="Optional context for your team..."
                  className="h-16 rounded-2xl bg-white/5 border-white/10 px-6 text-white placeholder:text-slate-600 focus:border-[color:var(--color-accent-primary)]/50 focus:bg-white/10 transition-all font-medium"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="h-16 w-full rounded-2xl bg-[color:var(--color-accent-primary)] hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] text-xs transition-all shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:shadow-[0_0_60px_rgba(99,102,241,0.5)] border-none flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                Launch Workspace
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════ */}
      <footer className="py-32 px-6 border-t border-white/5 bg-nebula-950/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-primary/5 blur-[150px] pointer-events-none" />
        
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start gap-20 relative z-10">
          <div className="space-y-8 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-accent-primary to-accent-cyan rounded-2xl flex items-center justify-center shadow-lg shadow-accent-primary/20">
                <Database className="text-white w-6 h-6" />
              </div>
              <span className="font-display font-bold text-3xl text-white tracking-tight">SchemaFlow</span>
            </div>
            <p className="text-slate-500 text-lg leading-relaxed font-light">
              Architecting the future of data systems. Built for performance, security, and developer joy.
            </p>
            <div className="flex gap-4">
              {[
                { icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>, label: "X" },
                { icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>, label: "LinkedIn" },
                { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>, label: "Mail" }
              ].map((social, i) => (
                <button 
                  key={i} 
                  className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-accent-primary/20 hover:text-white hover:scale-110 transition-all duration-300 border border-white/5"
                  aria-label={social.label}
                >
                  {social.icon}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-16 md:gap-24">
            <div className="space-y-6">
              <h5 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Product</h5>
              <ul className="space-y-4 text-slate-500 text-[15px] font-medium">
                <li><Link to="/docs" className="hover:text-accent-cyan transition-colors">Documentation</Link></li>
                <li><Link to="/dashboard" className="hover:text-accent-cyan transition-colors">Workspace Launcher</Link></li>
                <li><a href="#" className="hover:text-accent-cyan transition-colors">Relational Hub</a></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h5 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Social</h5>
              <ul className="space-y-4 text-slate-500 text-[15px] font-medium">
                <li><a href="#" className="hover:text-accent-cyan transition-colors">Twitter (X)</a></li>
                <li><a href="#" className="hover:text-accent-cyan transition-colors">LinkedIn</a></li>
                <li><a href="#" className="hover:text-accent-cyan transition-colors">Community Discord</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto mt-24 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] text-slate-600 font-black uppercase tracking-[0.4em]">
          <div>&copy; {new Date().getFullYear()} SchemaFlow Engineering. All rights reserved.</div>
          <div className="flex items-center gap-2">
            Status: <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> All Systems Online
          </div>
        </div>
      </footer>
    </div>
  );
}
