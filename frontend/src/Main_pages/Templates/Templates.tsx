import { motion } from "motion/react";
import { Navbar } from "../../components/layout/Navbar";
import { useTheme } from "../../hooks/useTheme";
import { TiltedCard } from "../../components/ui/TiltedCard";
import { ShoppingBag, Users, Share2, Lock, FileText, Layout, ArrowRight, Database } from "lucide-react";
import { Link } from "react-router-dom";

const TEMPLATES = [
  {
    id: "ecommerce",
    title: "E-Commerce Core",
    description: "The essential schema for modern digital storefronts including users, product variants, inventory, and order fulfillment flows.",
    icon: <ShoppingBag className="w-8 h-8 text-[#6366f1]" />,
    color: "from-indigo-500/20 to-cyan-500/5",
    accent: "text-indigo-400",
    tags: ["PostgreSQL", "MySQL", "Prisma"]
  },
  {
    id: "saas",
    title: "SaaS Starter (RBAC)",
    description: "A battle-tested foundation for B2B applications, complete with team management, granular role-based access control, and subscription tracking.",
    icon: <Users className="w-8 h-8 text-[#a855f7]" />,
    color: "from-purple-500/20 to-blue-500/5",
    accent: "text-purple-400",
    tags: ["Drizzle", "PostgreSQL", "Mongoose"]
  },
  {
    id: "social",
    title: "Social Graph",
    description: "Model complex social interactions with optimized schemas for followers, activity feeds, likes, and nested community discussions.",
    icon: <Share2 className="w-8 h-8 text-[#22d3ee]" />,
    color: "from-cyan-500/20 to-indigo-500/5",
    accent: "text-cyan-400",
    tags: ["Neo4j", "PostgreSQL", "TypeORM"]
  },
  {
    id: "auth",
    title: "Enterprise Auth",
    description: "An enterprise-grade authentication and profile management schema, designed for security and scalability across distributed systems.",
    icon: <Lock className="w-8 h-8 text-emerald-400" />,
    color: "from-emerald-500/20 to-teal-500/5",
    accent: "text-emerald-400",
    tags: ["Users", "Roles", "Permissions"]
  },
  {
    id: "cms",
    title: "Project CMS",
    description: "Perfect for content-driven sites, this template includes post versioning, category hierarchies, multi-author support, and SEO metadata.",
    icon: <FileText className="w-8 h-8 text-orange-400" />,
    color: "from-orange-500/20 to-red-500/5",
    accent: "text-orange-400",
    tags: ["Posts", "Tags", "Versioning"]
  },
  {
    id: "dashboard",
    title: "Admin Dashboard",
    description: "Complete operational schema for internal tools, featuring activity logs, audit trails, and multi-dimensional reporting structures.",
    icon: <Layout className="w-8 h-8 text-rose-400" />,
    color: "from-rose-500/20 to-pink-500/5",
    accent: "text-rose-400",
    tags: ["Audits", "Logs", "Analytics"]
  }
];

export default function Templates() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-nebula-950 text-slate-200 selection:bg-indigo-500/30">
      <Navbar theme={theme} onToggle={toggleTheme} />

      <main className="pt-40 pb-32 px-6">
        <div className="max-w-[1400px] mx-auto">
          {/* Header Section */}
          <div className="text-center mb-24">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8"
            >
              Industry Starters
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tighter font-display"
            >
              The Blueprint for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
                Data Sovereignty
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed font-medium"
            >
              Jumpstart your database architecture with industry-vetted schemas. 
              Clone any template into your workspace and start modeling in seconds.
            </motion.p>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {TEMPLATES.map((tpl, i) => (
              <motion.div
                key={tpl.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <TiltedCard
                  containerHeight="480px"
                  imageHeight="480px"
                  rotateAmplitude={10}
                  scaleOnHover={1.03}
                  showTooltip={false}
                  displayOverlayContent={true}
                  overlayContent={
                    <div className="p-10 h-full flex flex-col glass-panel rounded-[2.5rem] border-white/5 hover:border-white/10 transition-all group relative overflow-hidden backdrop-blur-none">
                      {/* Abstract Background Gradient */}
                      <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${tpl.color} blur-[100px] -z-10 transition-all duration-500 group-hover:scale-110`} />
                      
                      <div className="mb-10 p-5 rounded-2xl bg-white/5 w-fit border border-white/5 group-hover:bg-white/10 transition-all duration-500">
                        {tpl.icon}
                      </div>
                      
                      <h3 className="text-3xl font-bold mb-4 font-display text-white tracking-tight">{tpl.title}</h3>
                      <p className="text-slate-400 text-base leading-relaxed mb-10 font-medium group-hover:text-slate-200 transition-colors">
                        {tpl.description}
                      </p>

                      <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                        <div className="flex gap-2">
                          {tpl.tags.map(tag => (
                            <span key={tag} className="px-2.5 py-1 rounded-md bg-white/5 text-[9px] font-black uppercase tracking-wider text-slate-500 border border-white/5">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <Link 
                          to="/" 
                          className="flex items-center gap-2 text-white text-[11px] font-black uppercase tracking-widest hover:text-indigo-400 transition-colors"
                        >
                          Use <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  }
                />
              </motion.div>
            ))}
          </div>

          {/* Call to Action Footer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mt-32 p-16 glass-panel rounded-[3rem] border-white/5 bg-gradient-to-r from-indigo-500/10 via-transparent to-cyan-500/10 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(99,102,241,0.15),transparent)] pointer-events-none" />
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-display tracking-tight">Don't see what you need?</h2>
            <p className="text-slate-400 text-xl mb-12 max-w-2xl mx-auto font-medium">
              Start from a blank canvas and design your custom architecture from scratch using our high-performance workspace.
            </p>
            <Link to="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="px-12 py-5 bg-white text-nebula-950 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-all shadow-2xl shadow-white/5"
              >
                Create Custom Schema
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </main>

      {/* Simplified Footer Integration */}
      <footer className="py-20 px-6 border-t border-white/5 bg-nebula-950/40">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <Database className="text-white w-5 h-5" />
              </div>
              <span className="font-display font-bold text-2xl text-white tracking-tight">SchemaFlow</span>
          </div>
          <div className="flex gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/docs" className="hover:text-white transition-colors">Docs</Link>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">
            &copy; {new Date().getFullYear()} SchemaFlow Engineering
          </p>
        </div>
      </footer>
    </div>
  );
}
