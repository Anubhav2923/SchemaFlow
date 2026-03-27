import { Link } from "react-router-dom";
import type { Project } from "../../../features/projects/api";
import { formatDate, projectHref } from "../utils";

interface AuthenticatedProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
  onToggleFavorite: (project: Project) => void;
  onToggleArchive: (project: Project) => void;
}

export function AuthenticatedProjectCard({
  project,
  onDelete,
  onToggleFavorite,
  onToggleArchive,
}: AuthenticatedProjectCardProps) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl border border-white/5 bg-[var(--panel)] shadow-sm transition-all duration-500 hover:shadow-[0_0_40px_rgba(99,102,241,0.15)] hover:-translate-y-2 hover:border-indigo-500/30 glass-panel">
      <Link to={projectHref(project)} className="block relative">
        <div className="aspect-[16/10] w-full bg-slate-50/50 dark:bg-[#020617]/40 flex items-center justify-center p-8 relative overflow-hidden">
          {/* Schematic visual */}
          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(99,102,241,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.2)_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
          
          <div className="relative flex flex-col items-center gap-4 scale-90 group-hover:scale-110 transition-transform duration-500 ease-out">
            <div className="h-16 w-16 rounded-[22px] bg-white/5 dark:bg-[#0f172a] shadow-2xl border border-indigo-500/20 flex items-center justify-center backdrop-blur-md">
              <svg className="h-8 w-8 text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 group-hover:text-indigo-300 transition-colors">Database Diagram</span>
              <div className="h-1 w-8 bg-indigo-500/20 rounded-full mt-2 group-hover:w-12 transition-all" />
            </div>
          </div>
          <div className="absolute top-5 left-5">
            <span className="rounded-xl bg-indigo-500/10 backdrop-blur-md px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-400 border border-indigo-500/20 shadow-lg">
              {project.database_type.toUpperCase()}
            </span>
          </div>
        </div>
      </Link>

      <div className="p-6 relative">
        <div className="flex items-start justify-between gap-10">
          <Link to={projectHref(project)} className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold text-[var(--ink-strong)] tracking-tight group-hover:text-indigo-500 transition-colors duration-300">
              {project.name}
            </h3>
            <p className="mt-1 text-[11px] text-slate-500 font-bold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500/50" />
              Updated {formatDate(project.updated_at)}
            </p>
          </Link>
          <div className="flex items-center gap-1.5 bg-white/5 dark:bg-black/20 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => onToggleFavorite(project)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all active:scale-90 ${project.is_favorite
                  ? "bg-amber-500/10 text-amber-500"
                  : "text-slate-500 hover:bg-amber-500/10 hover:text-amber-500"
                }`}
              aria-label="Toggle favorite"
            >
              <svg className="h-4 w-4" fill={project.is_favorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="m12 17.3-5.2 3 1.4-5.9L3.5 10l6.1-.5L12 4l2.4 5.5 6.1.5-4.7 4.4 1.4 5.9z" />
              </svg>
            </button>
            <button
              onClick={() => onToggleArchive(project)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all active:scale-90 ${project.is_archived
                  ? "bg-indigo-500/10 text-indigo-500"
                  : "text-slate-500 hover:bg-indigo-500/10 hover:text-indigo-500"
                }`}
              aria-label="Toggle archive"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </button>
            <div className="w-px h-4 bg-white/5 mx-0.5" />
            <button
              onClick={() => onDelete(project.id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all active:scale-90"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border ${
               project.is_archived ? "bg-slate-500/10 text-slate-500 border-slate-500/10" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/10"
             }`}>
              <div className={`h-1.5 w-1.5 rounded-full ${project.is_archived ? "bg-slate-500" : "bg-emerald-500 animate-pulse"}`} />
              {project.is_archived ? "Archived" : "Live"}
            </span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500/50">SchemaFlow Dev</p>
        </div>
      </div>
    </div>
  );
}
