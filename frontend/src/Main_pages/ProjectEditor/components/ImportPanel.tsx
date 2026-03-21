import type { ChangeEvent } from "react";

interface ImportPanelProps {
  isDark: boolean;
  sqlImport: string;
  setSqlImport: (v: string) => void;
  handleImportSql: () => void;
  handleImportSqlFile: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function ImportPanel({ isDark, sqlImport, setSqlImport, handleImportSql, handleImportSqlFile }: ImportPanelProps) {
  return (
    <div className="flex-1 overflow-y-auto px-3 py-4">
      <div className={`rounded-2xl border p-4 space-y-3 ${isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}>
        <div>
          <p className="text-[14px] font-black uppercase tracking-widest text-indigo-400">Import SQL</p>
          <p className={`mt-1 text-[15px] font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            Paste <code className="font-mono">CREATE TABLE</code> and <code className="font-mono">ALTER TABLE</code> statements to bootstrap the diagram.
          </p>
        </div>
        <label className={`flex cursor-pointer items-center justify-center rounded-xl border border-dashed px-4 py-4 text-[13px] font-extrabold uppercase tracking-[0.12em] transition ${isDark ? "border-slate-700 bg-slate-950 text-slate-300 hover:border-indigo-500" : "border-slate-300 bg-white text-slate-600 hover:border-indigo-400"}`}>
          Click A <code className="font-mono">.sql</code> File To Upload
          <input
            type="file"
            accept=".sql,text/sql,application/sql"
            className="hidden"
            onChange={(event) => void handleImportSqlFile(event)}
          />
        </label>
        <textarea
          value={sqlImport}
          onChange={(e) => setSqlImport(e.target.value)}
          placeholder="Paste CREATE TABLE / ALTER TABLE SQL here, or upload a .sql file above."
          className={`min-h-48 w-full rounded-xl border px-3 py-2 text-[12px] font-mono outline-none ${isDark ? "border-slate-800 bg-slate-950 text-slate-200 placeholder:text-slate-600" : "border-slate-200 bg-white text-slate-700 placeholder:text-slate-400"}`}
        />
        <button onClick={() => void handleImportSql()} className="w-full rounded-xl bg-emerald-500 px-3 py-2.5 text-[11px] font-black uppercase tracking-widest text-white transition hover:bg-emerald-600">
          Import SQL Dump
        </button>
      </div>
    </div>
  );
}
