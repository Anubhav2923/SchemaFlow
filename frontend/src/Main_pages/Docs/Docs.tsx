import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Book,
  Terminal,
  Layers,
  Search,
  ChevronRight,
  Zap,
  ShieldCheck,
  MousePointer2,
  PlusCircle,
  Link2,
  FileDown,
  Layout,
  Network,
  Download,
  Database,
  Code,
  Share2,
  History,
  Cpu,
} from "lucide-react";
import { cn } from "../../lib/utils";

/* ─── Styles ───────────────────────────────────────── */
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.1);
    border-radius: 20px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(99, 102, 241, 0.3);
  }
`;

/* ─── Type Definitions ─────────────────────────────── */
type DocSection =
  | "Introduction"
  | "Quick Start Guide"
  | "Core Workflow"
  | "Workspace Setup"
  | "The Visual Canvas"
  | "Relationship Engine"
  | "Constraints & Types"
  | "SQL Import / DDL"
  | "Prisma & Drizzle"
  | "Mongoose Schemes"
  | "Raw SQL Export"
  | "Auto-Layout"
  | "Schema Versioning"
  | "Collaboration Rollout"
  | "Editor Shortcuts";

export function Documentation() {
  const [activeSection, setActiveSection] = useState<DocSection>("Introduction");

  const sections = [
    {
      title: "Getting Started",
      items: ["Introduction", "Quick Start Guide", "Core Workflow", "Workspace Setup"],
    },
    {
      title: "Core Architecture",
      items: ["The Visual Canvas", "Relationship Engine", "Constraints & Types"],
    },
    {
      title: "Data Operations",
      items: ["SQL Import / DDL", "Prisma & Drizzle", "Mongoose Schemes", "Raw SQL Export"],
    },
    {
      title: "Power Tools",
      items: ["Auto-Layout", "Schema Versioning", "Collaboration Rollout", "Editor Shortcuts"],
    },
  ];

  /* ─── Content Render Helper ─────────────────────────── */
  const renderContent = () => {
    switch (activeSection) {
      case "Introduction":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-2 text-accent-cyan text-[13px] font-bold uppercase tracking-widest mb-6 font-mono">
              <Book className="w-4 h-4" />
              Documentation / Introduction
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white tracking-tighter font-display leading-[1.1]">
              The Architect's <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-cyan transition-all">
                Forge Workspace
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-400 leading-relaxed font-light max-w-4xl mb-12">
              SchemaForge is the most advanced database design workspace ever built. We combine visual intuition with
              automation to give your engineering team a single source of truth for your data structures.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-10 glass-panel rounded-[2.5rem] border-white/5">
                <Layers className="w-10 h-10 text-accent-primary mb-6" />
                <h3 className="text-2xl font-bold mb-4 text-white font-display">Visual Modeling</h3>
                <p className="text-slate-400 text-xl leading-relaxed">
                  Stop using generic drawing tools for your database logic. Forge is built specifically for architects,
                  enforcing normalization and integrity at the canvas level.
                </p>
              </div>
              <div className="p-10 glass-panel rounded-[2.5rem] border-white/5">
                <ShieldCheck className="w-10 h-10 text-accent-cyan mb-6" />
                <h3 className="text-2xl font-bold mb-4 text-white font-display">Type-Safe Infrastructure</h3>
                <p className="text-slate-400 text-xl leading-relaxed">
                  Export directly to modern ORMs. We support Prisma, Drizzle, and Mongoose out of the box, ensuring your
                  code matches your diagram perfectly.
                </p>
              </div>
            </div>
          </motion.div>
        );

      case "Quick Start Guide":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-2 text-accent-cyan text-[13px] font-bold uppercase tracking-widest mb-6 font-mono">
              <Zap className="w-4 h-4" />
              Documentation / Quick Start
            </div>
            <h1 className="text-5xl font-bold mb-6 text-white tracking-tighter font-display">Quick Start Guide</h1>
            <p className="text-xl text-slate-400 font-light mb-12 leading-relaxed">
              Launch your first diagram in under 60 seconds. This guide covers the essential loop of diagramming and exporting.
            </p>

            <div className="space-y-6">
              {[
                { step: "01", icon: <PlusCircle />, title: "Create a Workspace", text: "Click 'New Diagram' on your dashboard. Give it a name and select your target database type (e.g., PostgreSQL)." },
                { step: "02", icon: <Layers />, title: "Add Main Tables", text: "Use the left panel or right-click the canvas to add your core domain tables like 'Users' or 'Products'." },
                { step: "03", icon: <Link2 />, title: "Connect Handles", text: "Drag from a primary key handle to a target column to establish one-to-many relationships instantly." },
                { step: "04", icon: <FileDown />, title: "Download Code", text: "Open the 'Code Hub', select your stack, and copy the auto-generated DDL or ORM schema." }
              ].map((s, i) => (
                <div key={i} className="flex gap-8 p-8 bg-white/5 rounded-3xl border border-white/5 items-center hover:bg-white/10 transition-colors cursor-default">
                  <div className="text-4xl font-black text-white/20 select-none font-mono">{s.step}</div>
                  <div className="w-12 h-12 rounded-2xl bg-accent-primary/20 flex items-center justify-center text-accent-primary shrink-0">{s.icon}</div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2 font-display">{s.title}</h4>
                    <p className="text-slate-400 text-xl leading-relaxed">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case "Core Workflow":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-2 text-accent-cyan text-[13px] font-bold uppercase tracking-widest mb-6 font-mono">
              <Layout className="w-4 h-4" />
              Documentation / Core Workflow
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 font-display tracking-tight">The Architect's Loop</h2>
            <div className="space-y-12">
              <div className="p-10 glass-panel rounded-[2.5rem] border-white/5">
                <h3 className="text-3xl font-bold text-white mb-6 font-display">01. Modeling Entity Discovery</h3>
                <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-3xl">Start by mapping out your core entities. In SchemaForge, every table is a "Node". Focus on naming conventions and basic data types before establishing links.</p>
                <div className="flex gap-3">
                  <div className="h-2 w-24 bg-accent-primary rounded-full shadow-[0_0_15px_rgba(99,102,241,0.6)]" />
                  <div className="h-2 w-24 bg-white/5 rounded-full" />
                  <div className="h-2 w-24 bg-white/5 rounded-full" />
                </div>
              </div>
              <div className="p-10 glass-panel rounded-[2.5rem] border-white/5">
                <h3 className="text-3xl font-bold text-white mb-6 font-display">02. Relationship Integrity</h3>
                <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-3xl">Once entities are defined, connect them. Forge enforces referential integrity: you can only connect compatible data types. Drag and drop to auto-generate Foreign Key indexes.</p>
                <div className="flex gap-3">
                  <div className="h-2 w-24 bg-accent-primary rounded-full" />
                  <div className="h-2 w-24 bg-accent-primary rounded-full shadow-[0_0_15px_rgba(99,102,241,0.6)]" />
                  <div className="h-2 w-24 bg-white/5 rounded-full" />
                </div>
              </div>
            </div>
          </motion.div>
        );

      case "Workspace Setup":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-5xl font-bold text-white mb-8 font-display tracking-tight">Workspace Setup</h2>
            <p className="text-xl text-slate-400 font-light mb-12 leading-relaxed">Configuring your project settings for production requirements.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: "Database Type", text: "Select from PostgreSQL, MySQL, or MongoDB. This affects the available data types in the table editor." },
                { title: "Collaboration Settings", text: "Invite team members via email to collaborate on the same diagram in real-time." },
                { title: "Export Defaults", text: "Set your default ORM (e.g. Prisma) to skip configuration during the export phase." },
                { title: "Dark/Light Modes", text: "Switch between high-contrast and low-light themes for long architecture sessions." }
              ].map((cfg, i) => (
                <div key={i} className="p-8 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all">
                  <h4 className="text-xl font-bold text-white mb-3 font-display">{cfg.title}</h4>
                  <p className="text-slate-400 text-xl leading-relaxed">{cfg.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case "The Visual Canvas":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-4xl font-bold text-white mb-6 font-display">The High-Performance Canvas</h2>
            <div className="aspect-video glass-panel rounded-[2.5rem] border-accent-primary/20 mb-10 grid-pattern flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-accent-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="flex flex-col items-center gap-4 group cursor-pointer relative z-10 transition-transform group-hover:scale-110">
                <div className="p-6 rounded-[2rem] bg-accent-primary text-white shadow-3xl shadow-accent-primary/50 ring-4 ring-white/10">
                  <MousePointer2 className="w-10 h-10" />
                </div>
                <span className="text-[11px] uppercase font-black tracking-[0.4em] text-accent-cyan">Infinite Grid Visualization</span>
              </div>
            </div>
            <p className="text-lg text-slate-400 font-light leading-relaxed mb-10">
              Our canvas is built on a virtualized rendering engine, allowing for zero-lag manipulation of thousands of tables.
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-10 bg-white/5 rounded-[2.5rem] border border-white/10 hover:border-accent-primary/30 transition-all">
                <h4 className="text-2xl font-bold text-white mb-4 font-display">Row-Level Ports</h4>
                <p className="text-slate-400 text-[15px] leading-relaxed">Every column within a table table node features a smart connection port. These ports are color-coded based on handle type (Primary vs Foreign).</p>
              </div>
              <div className="p-10 bg-white/5 rounded-[2.5rem] border border-white/10 hover:border-accent-primary/30 transition-all">
                <h4 className="text-2xl font-bold text-white mb-4 font-display">Z-Index Controls</h4>
                <p className="text-slate-400 text-[15px] leading-relaxed">Bring tables to the front or send them to the back using standard keyboard shortcuts (Ctrl+f/Ctrl+b) for complex overlapping structures.</p>
              </div>
            </div>
          </motion.div>
        );

      case "Relationship Engine":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-2 text-accent-cyan text-[13px] font-bold uppercase tracking-widest mb-6 font-mono">
              <Network className="w-4 h-4" />
              Documentation / Relationship Engine
            </div>
            <h2 className="text-6xl font-bold text-white mb-8 font-display tracking-tight leading-[1.1]">Referential Logic <br /><span className="text-white/30">Engine V2</span></h2>
            <p className="text-xl text-slate-400 font-light mb-12 leading-relaxed max-w-4xl">
              Forget manually writing junction tables. The engine automatically detects relationship types and updates your whole diagram state.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {[
                { title: "One-to-One", desc: "For user profile extensions or distinct entity separations." },
                { title: "One-to-Many", desc: "The standard link (e.g., Category to Product)." },
                { title: "Many-to-Many", desc: "Forge auto-injects a junction table into your logic." }
              ].map((type) => (
                <div key={type.title} className="p-10 glass-panel rounded-[2.5rem] border-white/5 text-center group hover:bg-white/10 transition-all">
                  <div className="text-4xl font-black text-white/5 mb-6 group-hover:text-accent-primary transition-colors">{type.title}</div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.1em] leading-relaxed">
                    {type.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-12 bg-accent-primary/5 rounded-[3rem] border border-accent-primary/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/10 blur-[80px] -z-10" />
              <h4 className="text-2xl font-bold text-white mb-6 flex items-center gap-4 font-display">
                <ShieldCheck className="w-8 h-8 text-accent-primary" />
                Referential Action Control
              </h4>
              <p className="text-slate-400 leading-relaxed max-w-3xl mb-8">Define how deletions propagate through your data. Select from Cascade, Set Null, No Action, or Restrict directly within the link configuration panel.</p>
              <div className="flex gap-4">
                <div className="px-5 py-2 rounded-full bg-accent-primary/20 border border-accent-primary/20 text-accent-primary text-[11px] font-black uppercase tracking-widest">Cascade</div>
                <div className="px-5 py-2 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[11px] font-black uppercase tracking-widest">Set Null</div>
              </div>
            </div>
          </motion.div>
        );

      case "Constraints & Types":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-5xl font-bold text-white mb-8 font-display">Constraints & Data Types</h2>
            <p className="text-xl text-slate-400 mb-12">SchemaForge supports every native type for SQL and NoSQL engines.</p>
            <div className="space-y-4">
              {["UUID & ULID", "JSONB / JSON", "Enums & Custom Domains", "Composite Primary Keys"].map((type, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-accent-cyan/30 transition-all group">
                  <span className="text-lg font-bold text-white font-display uppercase tracking-widest">{type}</span>
                  <ChevronRight className="w-5 h-5 text-accent-cyan opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0" />
                </div>
              ))}
            </div>
          </motion.div>
        );

      case "SQL Import / DDL":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-5xl font-bold text-white mb-8 font-display">SQL Reverse Engineering</h2>
            <p className="text-xl text-slate-400 mb-12 max-w-3xl leading-relaxed">Already have a database? Paste your raw .sql or .ddl dump and watch Forge reconstruct the visual nodes and relationships in real-time.</p>
            <div className="p-12 glass-panel rounded-[2.5rem] border-white/5 bg-nebula-900 border border-indigo-500/20 shadow-[0_0_50px_rgba(99,102,241,0.2)]">
              <Terminal className="w-12 h-12 text-accent-primary mb-8" />
              <h4 className="text-xl font-bold text-white mb-4 uppercase tracking-[0.2em] font-mono">Input DDL Parser</h4>
              <div className="bg-black/40 rounded-xl p-6 font-mono text-sm text-slate-400 border border-white/5">
                  // Paste your CREATE TABLE statements here...
              </div>
            </div>
          </motion.div>
        );

      case "Prisma & Drizzle":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-5xl font-bold text-white mb-8 font-display">Modern ORM Exports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-10 glass-panel rounded-[2.5rem] border-white/5 relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-6 text-accent-primary opacity-20"><Database className="w-16 h-16" /></div>
                <h4 className="text-3xl font-black text-white mb-4">Prisma</h4>
                <p className="text-slate-400 mb-6 leading-relaxed text-sm">Download a complete schema.prisma file including model relations, index definitions, and custom map attributes.</p>
                <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent-primary hover:text-white transition-colors">Download Template <Download className="w-3 h-3" /></button>
              </div>
              <div className="p-10 glass-panel rounded-[2.5rem] border-white/5 relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-6 text-accent-cyan opacity-20"><Cpu className="w-16 h-16" /></div>
                <h4 className="text-3xl font-black text-white mb-4">Drizzle</h4>
                <p className="text-slate-400 mb-6 leading-relaxed text-sm">Export high-performance TypeScript definitions (schema.ts) that perfectly map to your visual diagram nodes.</p>
                <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent-cyan hover:text-white transition-colors">Download Template <Download className="w-3 h-3" /></button>
              </div>
            </div>
          </motion.div>
        );

      case "Mongoose Schemes":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-5xl font-bold text-white mb-8 font-display">NoSQL Modeling (Mongoose)</h2>
            <p className="text-xl text-slate-400 mb-12">While Forge is relational-first, we provide full support for document-style schemas and sub-document embedding.</p>
            <div className="bg-white/5 rounded-[2.5rem] p-12 border border-white/10 ring-1 ring-white/5">
              <h4 className="text-2xl font-bold text-white mb-4 font-display leading-tight">Virtuals & ObjectId Hooks</h4>
              <p className="text-slate-400 text-lg font-light leading-relaxed mb-8">Export Mongoose.Schema definitions that include automatic population of ObjectIds based on your visual reference lines.</p>
              <div className="h-[2px] w-full bg-gradient-to-r from-accent-primary/50 to-transparent" />
            </div>
          </motion.div>
        );

      case "Raw SQL Export":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-2 text-accent-cyan text-[13px] font-bold uppercase tracking-widest mb-6 font-mono">
              <Download className="w-4 h-4" />
              Documentation / SQL Export
            </div>
            <h2 className="text-7xl font-bold text-white mb-8 font-display tracking-tight">DDL Generation</h2>
            <p className="text-2xl text-slate-400 font-light mb-12 leading-relaxed">Export your architecture to PostgreSQL, MySQL, or SQL Server with one click.</p>
            <div className="bg-nebula-900 rounded-[3rem] p-12 border border-white/5 relative overflow-hidden group shadow-2xl">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-4 h-4 rounded-full bg-red-500/20" />
                <div className="w-4 h-4 rounded-full bg-yellow-500/20" />
                <div className="w-4 h-4 rounded-full bg-green-500/20" />
              </div>
              <pre className="text-xl text-slate-300 overflow-x-auto leading-[1.6] font-mono">
                <code>{`CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "orders" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID REFERENCES "users"("id") ON DELETE CASCADE,
  "val" NUMERIC(15,2) DEFAULT 0.00
);`}</code>
              </pre>
            </div>
          </motion.div>
        );

      case "Auto-Layout":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-5xl font-bold text-white mb-8 font-display">Smart Auto-Layout</h2>
            <p className="text-xl text-slate-400 mb-12">Is your diagram getting messy? Use our spatial optimization engine to clean up overlapping nodes.</p>
            <div className="p-12 glass-panel rounded-[2.5rem] bg-accent-primary/10 border-accent-primary/20 text-center">
              <Layout className="w-16 h-16 text-accent-primary mx-auto mb-6" />
              <h4 className="text-2xl font-black text-white uppercase tracking-widest mb-4">Spatial Orthogonality</h4>
              <p className="text-slate-400 max-w-md mx-auto leading-relaxed underline decoration-accent-primary decoration-2 underline-offset-8">Press 'L' to re-calculate table spacing and relationship paths instantly.</p>
            </div>
          </motion.div>
        );

      case "Schema Versioning":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-5xl font-bold text-white mb-8 font-display tracking-tight">Snapshot & History</h2>
            <p className="text-xl text-slate-400 mb-12 font-light">Never lose a breakthrough structure. Versioning tracks every change locally and in the cloud.</p>
            <div className="space-y-6">
              {[
                { title: "Point-in-Time Recovery", icon: <History /> },
                { title: "Comparison View", icon: <Search /> },
                { title: "Commit Tagging", icon: <Code /> }
              ].map((v, i) => (
                <div key={i} className="flex items-center gap-6 p-8 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                  <div className="text-accent-cyan p-4 bg-accent-cyan/10 rounded-2xl">{v.icon}</div>
                  <span className="text-2xl font-bold text-white font-display">{v.title}</span>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case "Collaboration Rollout":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-5xl font-bold text-white mb-8 font-display">Multiplayer Workspace</h2>
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 p-10 glass-panel rounded-[3rem] border-white/5">
                <Share2 className="w-12 h-12 text-accent-primary mb-8 animate-pulse" />
                <h3 className="text-3xl font-bold text-white mb-4">Real-Time Presence</h3>
                <p className="text-slate-400 leading-relaxed font-light text-lg">See your team's cursors as they move nodes, edit columns, and define relationships. Collaboration is baked into the engine core.</p>
              </div>
              <div className="w-full md:w-64 h-64 glass-panel rounded-full flex items-center justify-center border-white/10 relative">
                <div className="absolute inset-0 bg-accent-primary/20 blur-[50px] animate-pulse" />
                <span className="text-accent-primary text-xs font-black uppercase tracking-[0.4em] relative z-10 text-center px-4 leading-relaxed">Live Sync <br />Active</span>
              </div>
            </div>
          </motion.div>
        );

      case "Editor Shortcuts":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-5xl font-bold text-white mb-8 font-display">Power User Shortcuts</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { k: "T", v: "Add New Table" },
                { k: "C", v: "Add Comment" },
                { k: "L", v: "Auto Layout" },
                { k: "Ctrl + D", v: "Duplicate Node" },
                { k: "Del", v: "Remove Selection" },
                { k: "Ctrl + S", v: "Force Save" }
              ].map((s, i) => (
                <div key={i} className="p-8 glass-panel rounded-3xl border-white/5 flex flex-col items-center justify-center text-center gap-4 hover:border-accent-primary/30 transition-all group">
                  <kbd className="px-6 py-3 bg-white/10 rounded-xl font-mono text-xl text-white border-b-4 border-white/5 group-hover:bg-accent-primary transition-colors">{s.k}</kbd>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{s.v}</span>
                </div>
              ))}
            </div>
          </motion.div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center py-24 text-center opacity-30">
            <Terminal className="w-16 h-16 mb-6" />
            <h3 className="text-2xl font-bold text-white font-display">Drafting Section: {activeSection}</h3>
            <p className="text-md mt-2">Section is currently undergoing technical review.</p>
          </div>
        );
    }
  };

  return (
    <div className="pt-32 pb-20 px-4 md:px-6 xl:px-8 min-h-screen bg-nebula-950 font-sans selection:bg-accent-primary/30">
      <style>{scrollbarStyles}</style>
      <div className="max-w-[1920px] mx-auto flex flex-col lg:flex-row gap-10 xl:gap-14">
        {/* ── Sidebar (Fixed Position) ─────────────────────── */}
        <aside className="w-full lg:w-[440px] xl:w-[480px] shrink-0">
          <div className="lg:sticky lg:top-32 space-y-10 lg:max-h-[calc(100vh-150px)] lg:overflow-y-auto pr-3 xl:pr-5 custom-scrollbar">
            <div className="relative group">
              <div className="absolute inset-0 bg-accent-primary/10 blur-[60px] group-focus-within:bg-accent-primary/20 transition-all -z-10" />
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-accent-primary transition-colors" />
              <input
                type="text"
                placeholder="Search architecture patterns..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-5 pl-16 pr-8 text-lg focus:outline-none focus:border-accent-primary focus:bg-white/10 transition-all text-white backdrop-blur-md placeholder:text-slate-600"
              />
            </div>

            <nav className="space-y-14 px-1 pb-20">
              {sections.map((section, i) => (
                <div key={i} className="space-y-8">
                  <h5 className="text-[13px] font-black text-white/60 uppercase tracking-[0.4em] flex items-center gap-6">
                    {section.title}
                    <div className="h-px flex-1 bg-white/10" />
                  </h5>
                  <ul className="space-y-6">
                    {section.items.map((item, j) => (
                      <li key={j}>
                        <button
                          onClick={() => setActiveSection(item as DocSection)}
                          className={cn(
                            "text-[1.35rem] font-bold transition-all flex items-center justify-between w-full group py-1",
                            activeSection === item ? "text-white scale-105" : "text-slate-400 hover:text-white"
                          )}
                        >
                          <div className="flex items-center gap-5">
                            {activeSection === item && (
                              <motion.div layoutId="active-indicator" className="w-2.5 h-2.5 rounded-full bg-accent-primary shadow-[0_0_20px_rgba(99,102,241,1)]" />
                            )}
                            <span className={cn(activeSection === item ? "opacity-100" : "opacity-80", "transition-all text-left")}>{item}</span>
                          </div>
                          <ChevronRight className={cn(
                            "w-5 h-5 transition-all text-accent-primary",
                            activeSection === item ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                          )} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* ── Content (Horizontal Divider) ──────────────── */}
        <div className="hidden lg:block w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />

        {/* ── Content (Dynamic Rendering) ───────────────── */}
        <main className="flex-1 max-w-none py-4 xl:pr-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
