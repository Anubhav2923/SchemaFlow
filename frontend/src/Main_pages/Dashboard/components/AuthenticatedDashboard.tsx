import type { Dispatch, SetStateAction, FormEvent } from "react";
import { useUser } from "@clerk/clerk-react";
import { Button } from "../../../components/ui/Button";
import { AuthenticatedProjectCard } from "./ProjectCard";
import { SidebarItem } from "./SidebarItem";
import { NewDiagramModal, type DiagramDatabaseType } from "../../../components/modals/NewDiagramModal";
import type { Project } from "../../../features/projects/api";
import type { ViewType } from "../utils";

interface AuthenticatedDashboardProps {
  isLoading: boolean;
  projects: Project[];
  visibleProjects: Project[];
  currentView: ViewType;
  setCurrentView: (v: ViewType) => void;
  // Modal handlers
  isModalOpen: boolean;
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  description: string;
  setDescription: Dispatch<SetStateAction<string>>;
  databaseType: DiagramDatabaseType;
  setDatabaseType: Dispatch<SetStateAction<DiagramDatabaseType>>;
  visibility: "public" | "private";
  setVisibility: Dispatch<SetStateAction<"public" | "private">>;
  isPending: boolean;
  // Card Actions
  onDelete: (id: string) => void;
  onToggleFavorite: (project: Project) => void;
  onToggleArchive: (project: Project) => void;
}

export function AuthenticatedDashboard({
  isLoading,
  projects,
  visibleProjects,
  currentView,
  setCurrentView,
  isModalOpen,
  setIsModalOpen,
  handleSubmit,
  name,
  setName,
  description,
  setDescription,
  databaseType,
  setDatabaseType,
  visibility,
  setVisibility,
  isPending,
  onDelete,
  onToggleFavorite,
  onToggleArchive,
}: AuthenticatedDashboardProps) {
  const { user } = useUser();

  const renderContent = () => {
    switch (currentView) {
      case "all":
        if (isLoading) return (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-fade-in">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-[16/11] rounded-2xl bg-[var(--panel-soft)] animate-pulse" />)}
          </div>
        );
        if (visibleProjects.length === 0) return (
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
            {visibleProjects.map((p) => (
              <AuthenticatedProjectCard
                key={p.id}
                project={p}
                onDelete={onDelete}
                onToggleFavorite={onToggleFavorite}
                onToggleArchive={onToggleArchive}
              />
            ))}
          </div>
        );

      case "favorites":
        if (isLoading) return (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-fade-in">
            {[1, 2, 3].map(i => <div key={i} className="aspect-[16/11] rounded-2xl bg-[var(--panel-soft)] animate-pulse" />)}
          </div>
        );
        if (visibleProjects.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in">
              <h3 className="text-2xl font-black text-[var(--ink-strong)] tracking-tight">No favorite diagrams yet</h3>
              <p className="mt-2 text-sm font-bold text-[var(--ink-muted)] max-w-sm mx-auto opacity-70">Star a project to keep it here for quick access.</p>
            </div>
          );
        }
        return (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-fade-in">
            {visibleProjects.map((p) => (
              <AuthenticatedProjectCard
                key={p.id}
                project={p}
                onDelete={onDelete}
                onToggleFavorite={onToggleFavorite}
                onToggleArchive={onToggleArchive}
              />
            ))}
          </div>
        );

      case "archived":
        if (isLoading) return (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-fade-in">
            {[1, 2, 3].map(i => <div key={i} className="aspect-[16/11] rounded-2xl bg-[var(--panel-soft)] animate-pulse" />)}
          </div>
        );
        if (visibleProjects.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in">
              <h3 className="text-2xl font-black text-[var(--ink-strong)] tracking-tight">Archive is empty</h3>
              <p className="mt-2 text-sm font-bold text-[var(--ink-muted)] max-w-sm mx-auto opacity-70">Archived diagrams will show up here when you tuck them away.</p>
            </div>
          );
        }
        return (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-fade-in">
            {visibleProjects.map((p) => (
              <AuthenticatedProjectCard
                key={p.id}
                project={p}
                onDelete={onDelete}
                onToggleFavorite={onToggleFavorite}
                onToggleArchive={onToggleArchive}
              />
            ))}
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
    }
  };

  return (
    <div className="flex-1 w-full bg-[var(--page-bg)] selection:bg-indigo-500 selection:text-white">
      {/* ROW 1: HEADER */}
      <header className="border-b border-[var(--line-soft)] bg-[var(--panel)]">
        <div className="flex items-stretch h-24">
          <div className="w-80 border-r border-[var(--line-soft)] flex items-center px-10 relative overflow-hidden group">
            <div className="absolute inset-0 opacity-[0.08] pointer-events-none group-hover:opacity-[0.12] transition-opacity"
              style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #6366f1 10px, #6366f1 11px)' }} />
            <h1 className="text-xl font-black text-indigo-500 tracking-tighter uppercase relative">Database<br /><span className="text-slate-400">Diagram</span></h1>
          </div>

          <div className="flex-1 flex items-center justify-between px-8 bg-[var(--panel-soft)]/30">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-[var(--ink-strong)] uppercase tracking-tight">Workspace</h2>
                <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-[10px] font-black text-indigo-500 border border-indigo-500/10">{projects.length}</span>
              </div>
              <div className="h-6 w-px bg-[var(--line-soft)]" />
              <nav className="flex items-center gap-6">
                <button onClick={() => setCurrentView("all")} className={`text-[11px] font-black uppercase tracking-widest transition ${currentView === 'all' ? 'text-indigo-500' : 'text-[var(--ink-faint)] hover:text-indigo-500'}`}>All</button>
                <button onClick={() => setCurrentView("favorites")} className={`text-[11px] font-black uppercase tracking-widest transition ${currentView === 'favorites' ? 'text-indigo-500' : 'text-[var(--ink-faint)] hover:text-indigo-500'}`}>Favorites</button>
                <button onClick={() => setCurrentView("archived")} className={`text-[11px] font-black uppercase tracking-widest transition ${currentView === 'archived' ? 'text-indigo-500' : 'text-[var(--ink-faint)] hover:text-indigo-500'}`}>Archived</button>
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
      <div className="flex min-h-[calc(100vh-160px)]">
        <aside className="w-80 border-r border-[var(--line-soft)] bg-[var(--panel)] p-8 shrink-0 relative transition-all group/sidebar">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover/sidebar:opacity-[0.05] transition-opacity"
            style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #6366f1 10px, #6366f1 11px)' }} />

          <div className="relative">
            <div className="mb-8 px-2">
              <div className="flex items-center gap-3 p-2 rounded-2xl hover:bg-[var(--panel-soft)] transition cursor-pointer group">
                <div className="h-10 w-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:rotate-3 transition-transform">
                  <span className="text-sm font-black">{user?.firstName?.[0] || "U"}</span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-ls font-black text-[var(--ink-strong)]">{user?.firstName || "My"}'s Suite</p>
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
          </div>
        </aside>

        <main className="flex-1 p-8 lg:p-12 relative overflow-y-auto hide-scrollbar">
          <div className="absolute inset-0 opacity-[0.4] pointer-events-none bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#1e293b_1.5px,transparent_1.5px)] [background-size:32px_32px]" />
          <div className="relative">{renderContent()}</div>
        </main>
      </div>

      <NewDiagramModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        name={name}
        setName={setName}
        description={description}
        setDescription={setDescription}
        databaseType={databaseType}
        setDatabaseType={setDatabaseType}
        visibility={visibility}
        setVisibility={setVisibility}
        isPending={isPending}
        userName={user?.firstName || user?.username || "Anubhav"}
      />
    </div>
  );
}
