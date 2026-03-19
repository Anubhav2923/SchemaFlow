import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Navbar } from "../components/layout/Navbar";
import { useTheme } from "../hooks/useTheme";
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
} from "../features/projects/hooks";
import type { Project } from "../features/projects/api";

function formatDate(value: string | null | undefined) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

type ViewType = "all" | "shared" | "folders" | "templates" | "archived";

// --- SHARED COMPONENTS ---

function SidebarItem({ icon, label, active = false, onClick }: { icon: ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition-all duration-200 ${
      active 
        ? "bg-[#6366f1]/10 text-[#6366f1]" 
        : "text-[var(--ink-muted)] hover:bg-[var(--panel-soft)] hover:text-[var(--ink-strong)]"
    }`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

// --- AUTHENTICATED COMPONENTS ---

function AuthenticatedProjectCard({ project, onDelete }: { project: Project; onDelete: (id: string) => void }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-[var(--panel)] shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 hover:border-indigo-500/30">
      <Link to={`/projects/${project.id}`} className="block">
        <div className="aspect-[16/9] w-full bg-slate-50 dark:bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden border-b border-[var(--line-soft)]">
          {/* Schematic visual */}
          <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(rgba(99,102,241,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.2)_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="relative flex flex-col items-center gap-3 scale-90 group-hover:scale-100 transition-transform duration-500">
             <div className="h-14 w-14 rounded-2xl bg-white dark:bg-[#0f172a] shadow-xl border border-indigo-500/10 flex items-center justify-center">
                <svg className="h-7 w-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
             </div>
             <div className="flex flex-col items-center">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400">Database Diagram</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Physical Schema</span>
             </div>
          </div>
          <div className="absolute top-4 left-4">
             <span className="rounded-lg bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/20 shadow-sm">PostgreSQL</span>
          </div>
        </div>
      </Link>
      
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
           <Link to={`/projects/${project.id}`} className="min-w-0">
              <h3 className="truncate text-[15px] font-black text-[var(--ink-strong)] tracking-tight group-hover:text-indigo-500 transition">{project.name}</h3>
              <p className="mt-1 text-[11px] text-[var(--ink-muted)] font-bold opacity-60">Architect: {formatDate(project.updated_at)}</p>
           </Link>
           <button 
             onClick={() => onDelete(project.id)}
             className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-300 hover:bg-rose-500/10 hover:text-rose-500 transition-all active:scale-90"
           >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
           </button>
        </div>
        <div className="mt-4 flex items-center gap-3">
           <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1.5 border border-emerald-500/10">
             <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
             Active
           </span>
           <span className="text-[10px] font-bold text-slate-400">Public Access</span>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { data: projects = [], isLoading } = useProjects();
  const createProjectMutation = useCreateProject();
  const deleteProjectMutation = useDeleteProject();
  const { theme, toggleTheme } = useTheme();
  const { userId, isLoaded } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  
  const [currentView, setCurrentView] = useState<ViewType>("all");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;

    const createdProject = await createProjectMutation.mutateAsync({
      name: name.trim(),
      description: description.trim(),
    });

    setName("");
    setDescription("");
    setIsModalOpen(false);
    
    if (createdProject?.id) {
      navigate(`/projects/${createdProject.id}`);
    }
  }

  function handleDelete(projectId: string) {
    if (confirm("Permanently archive this architecture?")) {
      deleteProjectMutation.mutate(projectId);
    }
  }

  if (!isLoaded) return null;

  // --- RENDERING VIEWS ---

  const renderContent = () => {
    switch(currentView) {
      case "all":
        if (isLoading) return (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-fade-in">
            {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-[16/11] rounded-2xl bg-[var(--panel-soft)] animate-pulse" />)}
          </div>
        );
        if (projects.length === 0) return (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in">
             <div className="h-28 w-28 rounded-[40px] bg-indigo-500/5 flex items-center justify-center mb-8 border border-indigo-500/10 rotate-6 group hover:rotate-0 transition-transform duration-500">
                <svg className="h-12 w-12 text-indigo-500/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth="1.5" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
             </div>
             <h3 className="text-2xl font-black text-[var(--ink-strong)] tracking-tight italic">Visual Universe Empty</h3>
             <p className="mt-2 text-sm font-bold text-[var(--ink-muted)] max-w-sm mx-auto opacity-70">Your architecture library is waiting for its first star.</p>
             <Button onClick={() => setIsModalOpen(true)} variant="ghost" className="mt-8 text-[11px] font-black uppercase tracking-[0.25em] text-indigo-500 hover:text-indigo-600 dark:hover:text-white">
                Initialize Diagram {"->"}
             </Button>
          </div>
        );
        return (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-fade-in">
            {projects.map(p => <AuthenticatedProjectCard key={p.id} project={p} onDelete={handleDelete} />)}
          </div>
        );

      case "shared":
        return (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in">
             <div className="h-20 w-20 rounded-3xl bg-indigo-500/5 flex items-center justify-center mb-6">
                <svg className="h-10 w-10 text-indigo-500/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
             </div>
             <h3 className="text-xl font-black text-[var(--ink-strong)]">No Shared Work</h3>
             <p className="mt-2 text-sm text-[var(--ink-muted)] max-w-md mx-auto">Projects shared with your team or organization will appear here.</p>
             <button className="mt-6 text-[11px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600">Upgrade to Pro to Collaborate</button>
          </div>
        );

      case "folders":
        return (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in">
             <div className="h-20 w-20 rounded-3xl bg-indigo-500/5 flex items-center justify-center mb-6">
                <svg className="h-10 w-10 text-indigo-500/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
             </div>
             <h3 className="text-xl font-black text-[var(--ink-strong)]">Organize your Logic</h3>
             <p className="mt-2 text-sm text-[var(--ink-muted)] max-w-md mx-auto">Create collections to group related database diagrams by module or client.</p>
             <Button className="mt-6 rounded-xl h-10 px-6 font-black text-[10px] uppercase tracking-widest bg-indigo-500 border-none shadow-lg shadow-indigo-500/20">New Folder</Button>
          </div>
        );

      case "templates":
        return (
          <div className="animate-fade-in">
            <div className="mb-8">
               <h3 className="text-xl font-black text-[var(--ink-strong)] tracking-tight">Standard Schemas</h3>
               <p className="text-sm text-[var(--ink-muted)] font-medium">Kickstart your architecture with battle-tested templates.</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
               {["User Auth Flow", "E-commerce Engine", "Billing & SaaS", "Social Graph", "FinTech Core"].map(name => (
                 <div key={name} className="p-6 rounded-2xl bg-[var(--panel-soft)] border border-[var(--line-soft)] hover:border-indigo-500/30 hover:bg-white dark:hover:bg-[#111827] transition group cursor-pointer">
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                       <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </div>
                    <h4 className="text-sm font-black text-[var(--ink-strong)]">{name}</h4>
                    <p className="mt-1 text-[11px] text-[var(--ink-muted)] font-bold">Standard Library</p>
                    <button className="mt-4 text-[10px] font-black uppercase tracking-widest text-indigo-500 opacity-0 group-hover:opacity-100 transition-all">Use Template {"->"}</button>
                 </div>
               ))}
            </div>
          </div>
        );

      case "archived":
        return (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in">
             <div className="h-20 w-20 rounded-3xl bg-indigo-500/5 flex items-center justify-center mb-6">
                <svg className="h-10 w-10 text-indigo-500/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
             </div>
             <h3 className="text-xl font-black text-[var(--ink-strong)] tracking-tight">Safe Archive</h3>
             <p className="mt-2 text-sm text-[var(--ink-muted)] max-w-md mx-auto">No diagrams have been archived. Archived schemas won't appear in the main workspace.</p>
          </div>
        );
    }
  }

  // --- AUTHENTICATED VIEW ---
  if (userId) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)] selection:bg-indigo-500 selection:text-white">
        <Navbar theme={theme} onToggle={toggleTheme} />
        
        {/* ROW 1: HEADER */}
        <header className="border-b border-[var(--line-soft)] bg-[var(--panel)]">
           <div className="mx-auto max-w-[1600px] flex items-stretch h-24">
              {/* Box 1: "Database Diagram" Title */}
              <div className="w-72 border-r border-[var(--line-soft)] flex items-center px-8 relative overflow-hidden group">
                 <div className="absolute inset-0 opacity-[0.05] pointer-events-none group-hover:opacity-[0.1] transition-opacity" 
                      style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #6366f1 10px, #6366f1 11px)' }} />
                 <h1 className="text-xl font-black text-indigo-500 tracking-tighter uppercase relative">Database<br/><span className="text-slate-400">Diagram</span></h1>
              </div>

              {/* Box 2: Actions / Search Area */}
              <div className="flex-1 flex items-center justify-between px-8 bg-[var(--panel-soft)]/30">
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                       <h2 className="text-sm font-black text-[var(--ink-strong)] uppercase tracking-tight">Workspace</h2>
                       <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-[10px] font-black text-indigo-500 border border-indigo-500/10">{projects.length}</span>
                    </div>
                    <div className="h-6 w-px bg-[var(--line-soft)]" />
                    <nav className="flex items-center gap-6">
                       <button onClick={() => setCurrentView("all")} className={`text-[11px] font-black uppercase tracking-widest transition ${currentView === 'all' ? 'text-indigo-500' : 'text-[var(--ink-faint)] hover:text-indigo-500'}`}>Recent</button>
                       <button className="text-[11px] font-black uppercase tracking-widest text-[var(--ink-faint)] hover:text-indigo-500 transition">Favorites</button>
                    </nav>
                 </div>
                 
                 <div className="flex items-center gap-4">
                    <div className="relative group">
                       <input type="text" placeholder="Search diagrams..." className="w-72 h-11 pl-11 pr-4 bg-[var(--panel)] border border-[var(--line-soft)] rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all shadow-sm" />
                       <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                       </div>
                    </div>
                    <Button onClick={() => setIsModalOpen(true)} className="h-11 px-7 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 bg-indigo-500 hover:bg-indigo-600 border-none transition-all active:scale-95">
                       New Diagram
                    </Button>
                 </div>
              </div>
           </div>
        </header>

        {/* ROW 2: SIDEBAR + CONTENT */}
        <div className="mx-auto max-w-[1600px] flex min-h-[calc(100vh-160px)]">
           {/* Sidebar */}
           <aside className="w-72 border-r border-[var(--line-soft)] bg-[var(--panel)] p-6 shrink-0 relative transition-all">
               <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
                    style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 40px, #6366f1 40px, #6366f1 41px)' }} />
               
               <div className="relative">
                  <div className="mb-8 px-2">
                    <div className="flex items-center gap-3 p-2 rounded-2xl hover:bg-[var(--panel-soft)] transition cursor-pointer group">
                      <div className="h-10 w-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:rotate-3 transition-transform">
                         <span className="text-sm font-black">{user?.firstName?.[0] || "U"}</span>
                      </div>
                      <div className="min-w-0">
                         <p className="truncate text-xs font-black text-[var(--ink-strong)]">{user?.firstName || "My"}'s Suite</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Base Hub</p>
                      </div>
                    </div>
                  </div>

                  <nav className="space-y-1">
                    <SidebarItem active={currentView === "all"} onClick={() => setCurrentView("all")} label="All Diagrams" icon={<svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>} />
                    <SidebarItem active={currentView === "shared"} onClick={() => setCurrentView("shared")} label="Shared Work" icon={<svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
                    <SidebarItem active={currentView === "folders"} onClick={() => setCurrentView("folders")} label="Folders" icon={<svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>} />
                  </nav>

                  <div className="my-8 h-px bg-[var(--line-soft)] mx-2" />

                  <nav className="space-y-1">
                    <SidebarItem active={currentView === "templates"} onClick={() => setCurrentView("templates")} label="Templates" icon={<svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>} />
                    <SidebarItem active={currentView === "archived"} onClick={() => setCurrentView("archived")} label="Archived" icon={<svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>} />
                  </nav>

                  <div className="mt-12 p-5 rounded-2xl bg-slate-50 dark:bg-indigo-950/20 border border-slate-100 dark:border-indigo-900/20 shadow-sm shadow-indigo-500/5">
                     <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Nebula Pro</p>
                     <p className="mt-1.5 text-[11px] text-slate-500 font-bold leading-relaxed">Unlock infinite schemas and real-time collaboration.</p>
                     <button className="mt-4 w-full h-10 rounded-xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition shadow-lg shadow-indigo-500/20">Upgrade Now</button>
                  </div>
               </div>
           </aside>

           {/* Main Content Area */}
           <main className="flex-1 p-8 lg:p-12 relative overflow-y-auto hide-scrollbar">
              <div className="absolute inset-0 opacity-[0.4] pointer-events-none bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#1e293b_1.5px,transparent_1.5px)] [background-size:32px_32px]" />
              <div className="relative">{renderContent()}</div>
           </main>
        </div>

        {/* Create Modal */}
        {isModalOpen && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
              <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-[var(--panel)] p-10 shadow-3xl animate-in zoom-in duration-300">
                 <div className="mb-10 flex items-center justify-between">
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Project Creation</p>
                       <h2 className="mt-1 text-3xl font-black text-[var(--ink-strong)] tracking-tighter">New Universe</h2>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="h-10 w-10 rounded-full hover:bg-[var(--panel-soft)] flex items-center justify-center text-slate-400">
                       <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                 </div>
                 <form className="space-y-8" onSubmit={handleSubmit}>
                    <Input label="Workspace Name" placeholder="e.g. Core Commerce Engine" value={name} onChange={e => setName(e.target.value)} />
                    <Input label="Technical Brief" placeholder="Scope, focus, or project tag..." value={description} onChange={e => setDescription(e.target.value)} />
                    <Button type="submit" disabled={createProjectMutation.isPending} className="w-full h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-indigo-500 hover:bg-indigo-600 border-none">
                       {createProjectMutation.isPending ? "Connecting..." : "Launch Workspace"}
                    </Button>
                 </form>
              </div>
           </div>
        )}
      </div>
    );
  }

  // --- GUEST VIEW ---
  return (
    <div className="min-h-screen bg-[var(--page-bg)] selection:bg-indigo-500 selection:text-white">
      <Navbar theme={theme} onToggle={toggleTheme} />

      <main className="mx-auto max-w-[1600px] px-8 py-20">
        <section className="grid gap-16 lg:grid-cols-2 items-center">
          <div className="relative">
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[0.95] text-[var(--ink-strong)]">
              Model your<br/>
              <span className="text-indigo-500">physical world.</span>
            </h1>
            <p className="mt-8 text-lg font-bold text-[var(--ink-muted)] leading-relaxed max-w-lg opacity-80">
              The ultimate workspace for visual database architects. Build schemas, manage relationships, and export SQL in a nebula-inspired environment.
            </p>
            
            <div className="mt-12 flex flex-wrap gap-4">
               <div className="p-5 rounded-2xl border border-[var(--line-soft)] bg-[var(--panel)] shadow-sm">
                  <span className="block text-2xl font-black text-indigo-500">{projects.length}+</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active projects</span>
               </div>
               <div className="p-5 rounded-2xl border border-[var(--line-soft)] bg-[var(--panel)] shadow-sm">
                  <span className="block text-2xl font-black text-emerald-500">100%</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Export Ready</span>
               </div>
            </div>
          </div>

          <div className="rounded-[40px] border border-[var(--line-soft)] bg-[var(--panel)] p-10 lg:p-16 shadow-3xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px]" />
            
            <p className="text-[11px] font-black uppercase tracking-widest text-indigo-500">Quick Initialization</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--ink-strong)]">Start Workspace</h2>
            <p className="mt-3 text-sm font-bold leading-relaxed text-[var(--ink-muted)] opacity-60">
              Enter your project details below to launch into the visual schema editor.
            </p>

            <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
              <Input label="Workspace Title" placeholder="Financial Engine" className="h-14 rounded-2xl border-2 px-6" value={name} onChange={e => setName(e.target.value)} />
              <Input label="Description" placeholder="Auth, Billing, and Users" className="h-14 rounded-2xl border-2 px-6" value={description} onChange={e => setDescription(e.target.value)} />
              <Button type="submit" className="h-14 w-full rounded-2xl text-[11px] font-black uppercase tracking-widest bg-indigo-500 hover:bg-indigo-600 border-none" disabled={createProjectMutation.isPending}>
                Get Started Now
              </Button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
