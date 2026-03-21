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
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-[var(--panel)] shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 hover:border-indigo-500/30">
      <Link to={projectHref(project)} className="block">
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
            <span className="rounded-lg bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/20 shadow-sm">
              {project.database_type.toUpperCase()}
            </span>
          </div>
        </div>
      </Link>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <Link to={projectHref(project)} className="min-w-0">
            <h3 className="truncate text-[15px] font-black text-[var(--ink-strong)] tracking-tight group-hover:text-indigo-500 transition">
              {project.name}
            </h3>
            <p className="mt-1 text-[11px] text-[var(--ink-muted)] font-bold opacity-60">
              Architect: {formatDate(project.updated_at)}
            </p>
          </Link>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggleFavorite(project)}
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all active:scale-90 ${project.is_favorite
                  ? "bg-amber-500/10 text-amber-500"
                  : "text-slate-300 hover:bg-amber-500/10 hover:text-amber-500"
                }`}
              aria-label="Toggle favorite"
            >
              <svg className="h-4 w-4" fill={project.is_favorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="m12 17.3-5.2 3 1.4-5.9L3.5 10l6.1-.5L12 4l2.4 5.5 6.1.5-4.7 4.4 1.4 5.9z" />
              </svg>
            </button>
            <button
              onClick={() => onToggleArchive(project)}
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all active:scale-90 ${project.is_archived
                  ? "bg-slate-500/10 text-slate-500"
                  : "text-slate-300 hover:bg-slate-500/10 hover:text-slate-500"
                }`}
              aria-label="Toggle archive"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(project.id)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-300 hover:bg-rose-500/10 hover:text-rose-500 transition-all active:scale-90"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1.5 border border-emerald-500/10">
            <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
          <span className="text-[10px] font-bold text-slate-400">
            {project.is_archived ? "Archived" : "Workspace"}
          </span>
        </div>
      </div>
    </div>
  );
}
