import { TEMPLATE_SCHEMAS } from "../constants";

interface TemplatesPanelProps {
  isDark: boolean;
  selectedTemplateId: string | null;
  setSelectedTemplateId: (id: string | null) => void;
  handleApplyTemplate: (id: string) => void;
  handleSaveTemplateLayout: () => void;
}

export function TemplatesPanel({ 
  isDark, 
  selectedTemplateId, 
  setSelectedTemplateId,
  handleApplyTemplate,
  handleSaveTemplateLayout
}: TemplatesPanelProps) {
  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
      <div className="space-y-4">
        {TEMPLATE_SCHEMAS.map((template) => {
          const isSelected = selectedTemplateId === template.id;
          return (
            <div
              key={template.id}
              className={`group overflow-hidden rounded-2xl border transition-all duration-300 ${isSelected
                ? isDark ? "border-indigo-500/60 bg-slate-900 shadow-xl shadow-indigo-500/10 scale-[1.02]" : "border-indigo-300 bg-white shadow-lg scale-[1.02]"
                : isDark ? "border-slate-800 bg-slate-900/40 hover:border-slate-700" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
            >
              <button
                onClick={() => setSelectedTemplateId(isSelected ? null : template.id)}
                className="w-full px-4 py-4 text-left transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[17px] font-extrabold tracking-tight text-indigo-400">{template.name}</div>
                    <div className={`mt-1.5 text-[13px] font-medium leading-relaxed line-clamp-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {template.description}
                    </div>
                  </div>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${isSelected ? "bg-indigo-500 text-white" : isDark ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-400"}`}>
                    {isSelected ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    )}
                  </div>
                </div>
              </button>

              {isSelected && (
                <div className={`grid grid-cols-2 border-t p-2 gap-2 animate-in slide-in-from-top-2 duration-300 ${isDark ? "border-slate-800 bg-slate-950/40" : "border-slate-100 bg-slate-50/50"}`}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleApplyTemplate(template.id); }}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white transition hover:bg-emerald-600 active:scale-95 cursor-pointer shadow-sm shadow-emerald-500/20"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    Apply
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSaveTemplateLayout(); }}
                    className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-[11px] font-bold uppercase tracking-widest transition active:scale-95 cursor-pointer shadow-sm ${isDark ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-slate-200/50"}`}
                  >
                    <svg className="h-3.5 w-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                    Save
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
