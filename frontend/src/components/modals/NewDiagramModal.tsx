import React from "react";
import { Button } from "../ui/Button";

export type DiagramDatabaseType = "mysql" | "mongodb" | "postgresql" | "sqlserver";

interface NewDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  databaseType: DiagramDatabaseType;
  setDatabaseType: React.Dispatch<React.SetStateAction<DiagramDatabaseType>>;
  visibility: "public" | "private";
  setVisibility: (visibility: "public" | "private") => void;
  isPending: boolean;
  userName: string;
}

const DB_OPTIONS = [
  { 
    id: "mysql", 
    name: "MySQL", 
    icon: (
      <svg className="w-11 h-11 drop-shadow-sm" viewBox="0 0 128 128">
        <path d="M63.74 38.303c-20.914 0-38.303 6.91-38.303 14.887 0 7.977 17.389 14.887 38.303 14.887 20.914 0 38.303-6.91 38.303-14.887 0-7.977-17.389-14.887-38.303-14.887z" fill="#00758F" />
        <path d="M63.74 100.222c-20.914 0-38.303-6.91-38.303-14.887V73.23c5.783 5.488 19.348 9.878 38.303 9.878 18.955 0 32.52-4.39 38.303-9.878v12.105c0 7.977-17.389 14.887-38.303 14.887z" fill="#00758F" />
        <path d="M63.74 81.334c-20.914 0-38.303-6.91-38.303-14.887V55.15c5.783 5.488 19.348 9.878 38.303 9.878 18.955 0 32.52-4.39 38.303-9.878v11.297c0 7.977-17.389 14.887-38.303 14.887z" fill="#F29111" />
      </svg>
    )
  },
  { 
    id: "postgresql", 
    name: "PostgreSQL", 
    icon: (
      <img src="/PostgresSQL.png" className="w-14 h-14 object-contain brightness-105" alt="PostgreSQL" />
    )
  },
  {
    id: "mongodb",
    name: "MongoDB",
    icon: (
      <svg className="w-11 h-11 drop-shadow-sm" viewBox="0 0 128 128" fill="none">
        <path d="M64 12c-8 10-14 21-14 33 0 18 8 29 14 38 6-9 14-20 14-38 0-12-6-23-14-33Z" fill="#47A248" />
        <path d="M64 27c-2 10-3 20-3 32s1 22 3 33c2-11 3-21 3-33s-1-22-3-32Z" fill="#2E7D32" />
        <path d="M64 102c-11-2-20-8-25-17-5-9-6-19-5-29 1-8 4-15 9-22 2 13 8 24 16 34 1 1 3 3 5 6 2-3 4-5 5-6 8-10 14-21 16-34 5 7 8 14 9 22 1 10 0 20-5 29-5 9-14 15-25 17Z" fill="#47A248" opacity="0.3" />
      </svg>
    )
  },
  { 
    id: "sqlserver", 
    name: "SQL Server", 
    icon: (
      <svg className="w-11 h-11 drop-shadow-sm" viewBox="0 0 128 128">
        <path d="M110.1 82.2L64 108.8 17.9 82.2V28.8L64 2.2l46.1 26.6v53.4zm-14.8-44.9H32.7V61h62.6V37.3zm-63.1-2.9L64 15.1l31.8 19.3V82L64 101.3 32.2 82V34.4z" fill="#A91D22" />
        <path d="M44.7 44.7h38.6v6.4H44.7zm0 12.8h38.6v6.4H44.7z" fill="#A91D22" />
      </svg>
    )
  }
];

export function NewDiagramModal({
  isOpen,
  onClose,
  onSubmit,
  name,
  setName,
  description,
  setDescription,
  databaseType,
  setDatabaseType,
  visibility,
  setVisibility,
  isPending,
  userName
}: NewDiagramModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-950/80 backdrop-blur-md">
       <div className="group/modal w-full max-w-[880px] max-h-[90vh] overflow-hidden rounded-[30px] bg-white text-slate-900 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] flex animate-in zoom-in duration-500 ease-out">
          
          {/* LEFT SIDEBAR: DIAGRAM SETTINGS */}
          <div className="w-64 bg-[#f8fafc] p-8 border-r border-[#f1f5f9] hidden md:flex flex-col select-none">
             <div className="mb-8 group-hover/modal:scale-105 transition-transform duration-700">
                <h3 className="text-[18px] font-black text-[#0f172a] tracking-tight leading-tight">Diagram settings</h3>
                <div className="mt-1 h-1 w-6 bg-indigo-500 rounded-full" />
             </div>
             
             <div className="flex-1 space-y-8 overflow-y-auto hide-scrollbar">
                {/* Team / Workspace Card */}
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 font-['Plus_Jakarta_Sans']">Team Context</label>
                   <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:border-indigo-100 group/team cursor-default">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-indigo-500 text-white flex items-center justify-center font-black text-xs shadow-[0_4px_12px_rgba(99,102,241,0.2)] group-hover/team:rotate-6 transition-transform">
                           {userName?.[0]?.toUpperCase() || 'S'}
                        </div>
                        <div className="flex flex-col min-w-0">
                           <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider leading-tight truncate font-['Plus_Jakarta_Sans']">
                              {userName?.toUpperCase() || 'SPIDEY'}'S HUB
                           </span>
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Workspace</span>
                        </div>
                      </div>
                   </div>
                </div>

                <p className="text-[12px] font-semibold  leading-relaxed">
                   Establish the schema for your next big project. Choosing the right database type is critical for valid code export.
                </p>
                
                <div className="h-[1px] bg-slate-200/50 w-full" />
                
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Environment</p>
                   <div className="flex items-center gap-2.5 px-1">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
                      <span className="text-[11px] font-bold text-slate-600 tracking-tight">Production Node</span>
                   </div>
                </div>
             </div>
             
             <div className="mt-auto pt-6 border-t border-slate-100 overflow-hidden">
                <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100/50">
                  <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">System Ready</p>
                  <p className="text-[10px] text-indigo-900/40 font-bold mt-1">v2.0 Schema Engine</p>
                </div>
             </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 flex flex-col min-w-0 bg-white">
             {/* Fixed Header */}
             <div className="p-8 pb-4 flex justify-between items-center bg-white z-10">
                <div>
                   <h2 className="text-[26px] font-black text-[#0f172a] tracking-tighter antialiased">Create new diagram</h2>
                   <p className="text-[13px] font-bold text-slate-400 mt-0.5 tracking-tight">Initialize your architectural workflow</p>
                </div>
                <button 
                  onClick={onClose} 
                  className="h-10 w-10 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center transition-all hover:rotate-90 group/close"
                >
                   <svg className="h-6 w-6 group-hover/close:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>

             {/* Scrollable Form Content */}
             <div className="flex-1 overflow-y-auto px-8 py-4 hide-scrollbar">
                <form id="new-diagram-form" onSubmit={onSubmit} className="space-y-6">
                   {/* Diagram Name Input */}
                   <div>
                      <label className="block text-[11px] font-black uppercase tracking-[0.25em]  mb-3.5">Diagram name</label>
                      <input 
                         autoFocus
                         required
                         type="text" 
                         placeholder="e.g. Core Commerce Engine"
                         value={name}
                         onChange={e => setName(e.target.value)}
                         className="w-full h-15 px-6 rounded-2xl border-2 border-slate-100 bg-white text-[16px] font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 transition-all placeholder:text-slate-300 shadow-sm"
                      />
                   </div>

                   {/* Diagram Description */}
                   <div>
                      <label className="block text-[11px] font-black uppercase tracking-[0.25em]  mb-3.5">Description</label>
                      <textarea
                         rows={2}
                         placeholder="What is this diagram for?"
                         value={description}
                         onChange={e => setDescription(e.target.value)}
                         className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 bg-white text-[16px] font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 transition-all placeholder:text-slate-300 shadow-sm resize-none"
                      />
                   </div>

                   {/* Visibility Toggles */}
                   <div>
                      <label className="block text-[11px] font-black uppercase tracking-[0.25em]  mb-4">Privacy Level</label>
                      <div className="flex gap-6">
                         <label className="flex items-center gap-3.5 cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                               <input 
                                  type="radio" 
                                  name="visibility" 
                                  className="peer appearance-none h-5 w-5 rounded-full border-2 border-slate-200 checked:border-indigo-500 transition-all"
                                  checked={visibility === 'public'}
                                  onChange={() => setVisibility('public')}
                               />
                               <div className="absolute h-2.5 w-2.5 rounded-full bg-indigo-500 scale-0 peer-checked:scale-100 transition-transform duration-300" />
                            </div>
                            <span className={`text-[14px] font-bold transition-colors ${visibility === 'public' ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>Public Access</span>
                         </label>
                         
                         <label className="flex items-center gap-3.5 cursor-not-allowed group opacity-50">
                            <div className="relative flex items-center justify-center">
                               <input 
                                  disabled
                                  type="radio" 
                                  name="visibility" 
                                  className="appearance-none h-5 w-5 rounded-full border-2 border-slate-200"
                               />
                            </div>
                            <span className="text-[14px] font-bold text-slate-400">Private (Pro Only)</span>
                         </label>
                      </div>
                   </div>

                   {/* DB Type Selection */}
                   <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-4">Database target</label>
                       <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                         {DB_OPTIONS.map(db => (
                            <button
                               key={db.id}
                               type="button"
                               onClick={() => setDatabaseType(db.id as DiagramDatabaseType)}
                               className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 group/card relative select-none ${
                                  databaseType === db.id 
                                  ? 'border-indigo-500 bg-indigo-50/20 shadow-lg shadow-indigo-500/5 transform scale-[1.03]' 
                                  : 'border-slate-100 hover:border-indigo-200 bg-white'
                               }`}
                            >
                               <div className="absolute top-2 right-2">
                                 {databaseType === db.id && (
                                   <div className="h-4 w-4 rounded-full bg-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
                                      <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={5}><path d="M5 13l4 4L19 7" /></svg>
                                   </div>
                                 )}
                               </div>

                               <div className="h-10 flex items-center justify-center transition-all duration-500">
                                  {db.icon}
                               </div>
                               
                               <span className={`text-[10px] font-black uppercase tracking-widest leading-none text-center ${databaseType === db.id ? 'text-indigo-600' : 'text-slate-400 group-hover/card:text-indigo-400'}`}>
                                  {db.name}
                               </span>
                            </button>
                         ))}
                      </div>
                   </div>
                </form>
             </div>

             {/* Fixed Footer */}
             <div className="p-8 pt-4 border-t border-slate-100 flex justify-end bg-white">
                <Button 
                   form="new-diagram-form"
                   type="submit" 
                   disabled={isPending || !name.trim()} 
                   className="h-14 px-10 rounded-2xl text-[13px] font-black uppercase tracking-[0.22em] bg-indigo-600 hover:bg-slate-900 shadow-xl shadow-indigo-600/10 border-none transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                >
                   <span className="flex items-center gap-3">
                     {isPending ? "Connecting Node..." : "Launch Universe"}
                     <svg className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                     </svg>
                   </span>
                </Button>
             </div>
          </div>
       </div>
    </div>
  );
}
