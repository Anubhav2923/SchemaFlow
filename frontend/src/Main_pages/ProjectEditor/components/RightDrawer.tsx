import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { ExportFormat } from "../../../features/schema/api";
import { EXPORT_FORMATS } from "../constants";

interface RightDrawerProps {
  isDark: boolean;
  isCodeDrawerOpen: boolean;
  isAiDrawerOpen: boolean;
  onClose: () => void;
  // Code drawer
  selectedExportFormat: ExportFormat;
  setSelectedExportFormat: (f: ExportFormat) => void;
  exportCode: string | undefined;
  exportLanguage: string | undefined;
  isExportLoading: boolean;
  onRefreshCode: () => void;
  onCopyCode: () => void;
  onDownloadCode: () => void;
  // AI drawer
  aiPrompt: string;
  setAiPrompt: (v: string) => void;
  onGenerateWithAi: () => void;
  onOptimizeWithAi: () => void;
  aiGenerating: boolean;
  aiOptimizing: boolean;
  aiSummary: string | null;
  aiSuggestions: Array<{ title: string; priority: "high" | "medium" | "low"; reason: string; action: string }>;
}

export function RightDrawer({
  isDark, isCodeDrawerOpen, isAiDrawerOpen, onClose,
  selectedExportFormat, setSelectedExportFormat, exportCode, exportLanguage, isExportLoading,
  onRefreshCode, onCopyCode, onDownloadCode,
  aiPrompt, setAiPrompt, onGenerateWithAi, onOptimizeWithAi,
  aiGenerating, aiOptimizing, aiSummary, aiSuggestions,
}: RightDrawerProps) {
  return (
    <aside className={`flex min-h-0 flex-col border-l ${isDark ? "border-slate-800 bg-[#0b1220]" : "border-slate-200 bg-white"}`}>
      {/* Header */}
      <div className={`flex items-center justify-between border-b px-4 py-3 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
        <div>
          <p className={`text-[10px] font-black uppercase tracking-widest ${isAiDrawerOpen ? "text-emerald-400" : "text-indigo-400"}`}>
            {isAiDrawerOpen ? "AI Engine" : "Code Hub"}
          </p>
          <p className={`text-[11px] font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            {isAiDrawerOpen ? "Generate and optimize with Qwen 3.5" : "Live export formats and downloads"}
          </p>
        </div>
        <button onClick={onClose} className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${isDark ? "bg-slate-900 text-slate-300 border border-slate-700" : "bg-slate-50 text-slate-600 border border-slate-200"}`}>
          Close
        </button>
      </div>

      {/* Code Panel */}
      {isCodeDrawerOpen && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className={`border-b px-4 py-3 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedExportFormat}
                onChange={(e) => setSelectedExportFormat(e.target.value as ExportFormat)}
                className={`h-10 rounded-lg border px-3 text-[12px] font-bold outline-none ${isDark ? "border-slate-700 bg-slate-900 text-slate-200" : "border-slate-200 bg-slate-50 text-slate-700"}`}
              >
                {EXPORT_FORMATS.map((format) => <option key={format.value} value={format.value}>{format.label}</option>)}
              </select>
              <button onClick={onRefreshCode} className="rounded-lg bg-indigo-500 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white">Refresh</button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button onClick={onCopyCode} className={`flex-1 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest ${isDark ? "bg-slate-900 text-slate-200 border border-slate-700" : "bg-slate-50 text-slate-600 border border-slate-200"}`}>Copy</button>
              <button onClick={onDownloadCode} className={`flex-1 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest ${isDark ? "bg-slate-900 text-slate-200 border border-slate-700" : "bg-slate-50 text-slate-600 border border-slate-200"}`}>Download</button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <SyntaxHighlighter
              language={exportLanguage ?? "sql"}
              style={isDark ? oneDark : oneLight}
              customStyle={{ margin: 0, minHeight: "100%", background: "transparent", fontSize: "12px" }}
              wrapLongLines
            >
              {exportCode ?? (isExportLoading ? "Loading export..." : "// Open the code hub to preview generated code")}
            </SyntaxHighlighter>
          </div>
        </div>
      )}

      {/* AI Panel */}
      {isAiDrawerOpen && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className={`border-b px-4 py-3 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe the schema you want, for example: multi-tenant CRM with organizations, contacts, deals, pipelines, and activity logs."
              className={`min-h-28 w-full rounded-xl border px-3 py-2 text-[12px] font-medium outline-none ${isDark ? "border-slate-700 bg-slate-900 text-slate-200 placeholder:text-slate-600" : "border-slate-200 bg-slate-50 text-slate-700 placeholder:text-slate-400"}`}
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button onClick={() => void onGenerateWithAi()} className="rounded-lg bg-emerald-500 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white">
                {aiGenerating ? "Generating..." : "Generate ERD"}
              </button>
              <button onClick={() => void onOptimizeWithAi()} className={`rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest ${isDark ? "bg-slate-900 text-slate-200 border border-slate-700" : "bg-slate-50 text-slate-600 border border-slate-200"}`}>
                {aiOptimizing ? "Reviewing..." : "Optimize"}
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto px-4 py-4 space-y-3">
            {aiSummary && (
              <div className={`rounded-2xl border p-4 ${isDark ? "border-emerald-500/20 bg-emerald-500/5" : "border-emerald-200 bg-emerald-50"}`}>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Summary</p>
                <p className={`mt-2 text-[12px] font-medium leading-6 ${isDark ? "text-slate-200" : "text-slate-700"}`}>{aiSummary}</p>
              </div>
            )}
            {aiSuggestions.length > 0 && aiSuggestions.map((suggestion) => (
              <div key={`${suggestion.title}-${suggestion.priority}`} className={`rounded-2xl border p-4 ${isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className={`text-[12px] font-black ${isDark ? "text-slate-100" : "text-slate-700"}`}>{suggestion.title}</p>
                  <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-widest ${suggestion.priority === "high" ? "bg-rose-500 text-white" : suggestion.priority === "medium" ? "bg-amber-500 text-white" : "bg-sky-500 text-white"}`}>
                    {suggestion.priority}
                  </span>
                </div>
                <p className={`mt-2 text-[11px] font-medium leading-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{suggestion.reason}</p>
                <p className={`mt-3 text-[11px] font-bold leading-5 ${isDark ? "text-slate-200" : "text-slate-700"}`}>{suggestion.action}</p>
              </div>
            ))}
            {!aiSummary && aiSuggestions.length === 0 && (
              <div className={`rounded-2xl border-2 border-dashed p-6 text-center text-[12px] font-bold ${isDark ? "border-slate-800 text-slate-600" : "border-slate-200 text-slate-400"}`}>
                Ask Qwen to generate a schema or review the current one.
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
