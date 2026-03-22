import React from "react";
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
  onCancelAi: () => void;
  aiGenerating: boolean;
  aiOptimizing: boolean;
  aiSummary: string | null;
  aiSuggestions: Array<{ title: string; priority: "high" | "medium" | "low"; reason: string; action: string }>;
}

export function RightDrawer({
  isDark, isCodeDrawerOpen, isAiDrawerOpen, onClose,
  selectedExportFormat, setSelectedExportFormat, exportCode, exportLanguage, isExportLoading,
  onRefreshCode, onCopyCode, onDownloadCode,
  aiPrompt, setAiPrompt, onGenerateWithAi, onOptimizeWithAi, onCancelAi,
  aiGenerating, aiOptimizing, aiSummary, aiSuggestions,
}: RightDrawerProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    onCopyCode();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const Tooltip = ({ text }: { text: string }) => (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-[60]">
      <div className={`px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap shadow-xl border ${isDark ? "bg-slate-800 text-slate-200 border-slate-700" : "bg-slate-900 text-white border-slate-800"}`}>
        {text}
        <div className={`absolute top-full left-1/2 -translate-x-1/2 border-x-[4px] border-x-transparent border-t-[4px] ${isDark ? "border-t-slate-700" : "border-t-slate-800"}`} />
      </div>
    </div>
  );

  const [isFormatMenuOpen, setIsFormatMenuOpen] = React.useState(false);

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case "postgresql": return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      );
      case "mongoose": return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
      default: return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
    }
  };

  const CircularProgress = ({ isCancelable = false }: { isCancelable?: boolean }) => (
    <div className="group/loader relative h-6 w-6 shrink-0 transition-all hover:scale-110">
      <svg className="h-full w-full -rotate-90 scale-125" viewBox="0 0 24 24">
        <circle
          cx="12"
          cy="12"
          r="10"
          className={isDark ? "stroke-slate-800" : "stroke-slate-200"}
          strokeWidth="2.5"
          fill="none"
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          className="stroke-white animate-[progress_2s_linear_infinite]"
          strokeWidth="2.5"
          strokeDasharray="62.8"
          strokeDashoffset="62.8"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {isCancelable && (
        <div 
          onClick={(e) => { e.stopPropagation(); onCancelAi(); }}
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
        >
          <div className="h-2 w-2 rounded-sm bg-white" />
        </div>
      )}
      <style>{`
        @keyframes progress {
          0% { stroke-dashoffset: 62.8; }
          100% { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );

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
          <div className={`border-b px-4 py-4 ${isDark ? "border-slate-800 bg-slate-900/20" : "border-slate-100 bg-slate-50/50"}`}>
            <div className="flex flex-col gap-3">
              {/* Custom Dropdown Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsFormatMenuOpen(!isFormatMenuOpen)}
                  className={`flex w-full h-11 items-center justify-between rounded-xl border px-4 transition-all cursor-pointer ${isDark ? "border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-600" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 shadow-sm"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-indigo-500 opacity-80">{getFormatIcon(selectedExportFormat)}</div>
                    <span className="text-[13px] font-bold">{EXPORT_FORMATS.find(f => f.value === selectedExportFormat)?.label}</span>
                  </div>
                  <svg className={`h-4 w-4 transition-transform ${isFormatMenuOpen ? "rotate-180" : ""} ${isDark ? "text-slate-500" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isFormatMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-[65]" onClick={() => setIsFormatMenuOpen(false)} />
                    <div className={`absolute left-0 right-0 top-full z-[70] mt-2 overflow-hidden rounded-2xl border p-1 shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
                      {EXPORT_FORMATS.map((format) => (
                        <button
                          key={format.value}
                          onClick={() => {
                            setSelectedExportFormat(format.value);
                            setIsFormatMenuOpen(false);
                          }}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-bold transition-all cursor-pointer ${selectedExportFormat === format.value ? (isDark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-50 text-indigo-600") : (isDark ? "text-slate-400 hover:bg-slate-700 hover:text-slate-200" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")}`}
                        >
                          <div className={selectedExportFormat === format.value ? "text-indigo-500" : "text-slate-400 opacity-60"}>
                            {getFormatIcon(format.value)}
                          </div>
                          {format.label}
                          {selectedExportFormat === format.value && (
                            <svg className="ml-auto h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative group">
                  <button 
                    onClick={onRefreshCode} 
                    className="flex items-center justify-center h-11 w-11 rounded-xl bg-indigo-500 text-white transition-all hover:bg-indigo-600 active:scale-95 shadow-lg shadow-indigo-500/20 cursor-pointer"
                  >
                    <svg className={`h-5 w-5 ${isExportLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <Tooltip text="Refresh Code" />
                </div>

                <div className={`flex flex-1 items-center p-1 rounded-xl border ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200 shadow-sm"}`}>
                  <div className="relative flex-1 group">
                    <button 
                      onClick={handleCopy} 
                      className={`w-full flex items-center justify-center h-9 rounded-lg transition-all active:scale-95 cursor-pointer ${copied ? "text-emerald-500 bg-emerald-500/10" : isDark ? "text-slate-400 hover:text-slate-100 hover:bg-slate-800" : "text-slate-500 hover:text-white hover:bg-emerald-500"}`}
                    >
                      {copied ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                      )}
                    </button>
                    {!copied && <Tooltip text="Copy Code" />}
                  </div>
                  
                  <div className={`w-0.5 h-6 mx-1 ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
                  
                  <div className="relative flex-1 group">
                    <button 
                      onClick={onDownloadCode} 
                      className={`w-full flex items-center justify-center h-9 rounded-lg transition-all active:scale-95 cursor-pointer ${isDark ? "text-slate-400 hover:text-slate-100 hover:bg-slate-800" : "text-slate-500 hover:text-white hover:bg-indigo-500"}`}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                    <Tooltip text="Download File" />
                  </div>
                </div>
              </div>
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
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button 
                onClick={() => !aiGenerating && !aiOptimizing && void onGenerateWithAi()} 
                disabled={aiOptimizing}
                className={`flex items-center justify-center gap-2.5 rounded-xl px-4 py-3.5 text-[11px] font-black uppercase tracking-widest text-white transition-all active:scale-95 disabled:opacity-70 ${aiGenerating ? "bg-emerald-600 shadow-inner" : "bg-emerald-500 hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20"}`}
              >
                {aiGenerating ? <CircularProgress isCancelable={true} /> : "Generate"}
              </button>
              <button 
                onClick={() => !aiGenerating && !aiOptimizing && void onOptimizeWithAi()} 
                disabled={aiGenerating}
                className={`flex items-center justify-center gap-2.5 rounded-xl px-4 py-3.5 text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-70 ${aiOptimizing ? (isDark ? "bg-slate-700 shadow-inner" : "bg-slate-100 shadow-inner") : (isDark ? "bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:shadow-md")}`}
              >
                {aiOptimizing ? <CircularProgress isCancelable={true} /> : "Optimize"}
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
