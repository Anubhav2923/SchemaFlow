import { TEMPLATE_SCHEMAS } from "../constants";

interface TemplatesPanelProps {
  isDark: boolean;
  selectedTemplateId: string | null;
  setSelectedTemplateId: (id: string | null) => void;
}

export function TemplatesPanel({ isDark, selectedTemplateId, setSelectedTemplateId }: TemplatesPanelProps) {
  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
      <div className="space-y-3">
        {TEMPLATE_SCHEMAS.map((template) => {
          const isSelected = selectedTemplateId === template.id;
          return (
            <button
              key={template.id}
              onClick={() => setSelectedTemplateId(template.id)}
              className={`w-full rounded-2xl border px-4 py-4 text-left transition ${isSelected
                ? isDark ? "border-indigo-500/60 bg-slate-900/70 shadow-lg shadow-indigo-500/10" : "border-indigo-300 bg-indigo-50/60 shadow-sm"
                : isDark ? "border-slate-800 bg-slate-900/40 hover:border-indigo-500/40" : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm"
                }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[17px] font-extrabold tracking-[-0.02em] text-indigo-400">{template.name}</div>
                  <div className={`mt-2 text-[15px] font-semibold leading-6 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{template.description}</div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] ${isSelected
                  ? "bg-indigo-500 text-white"
                  : isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                  }`}>
                  {isSelected ? "Previewing" : "Preview"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
