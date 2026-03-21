import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { PG_TYPES } from "../constants";

interface TypeSelectProps {
  value: string;
  onChange: (v: string) => void;
  isDark: boolean;
  size?: "sm" | "md";
}

export function TypeSelect({ value, onChange, isDark, size = "md" }: TypeSelectProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function openMenu() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!btnRef.current?.contains(e.target as globalThis.Node) && !menuRef.current?.contains(e.target as globalThis.Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", close, true);
    return () => document.removeEventListener("mousedown", close, true);
  }, [open]);

  return (
    <div className="relative w-full">
      <button
        ref={btnRef}
        type="button"
        onClick={() => open ? setOpen(false) : openMenu()}
        className={`w-full flex items-center justify-between rounded-lg font-bold border transition ${size === "sm" ? "px-2 py-1 text-[10px]" : "px-3 py-2 text-[12px]"
          } ${isDark ? "bg-slate-900 border-slate-700 text-slate-200 hover:border-indigo-500" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-400"
          }`}
      >
        <span className="truncate">{value}</span>
        <svg className={`h-3 w-3 opacity-50 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="m5 7 5 6 5-6" /></svg>
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: pos.top, left: pos.left, width: Math.max(pos.width, 220) }}
          className={`z-[9999] max-h-72 overflow-y-auto rounded-xl border shadow-2xl ${isDark ? "bg-[#0f172a] border-slate-700" : "bg-white border-slate-200"}`}
        >
          {PG_TYPES.map(({ group, options }) => (
            <div key={group}>
              <p className={`px-3 pt-2.5 pb-1 text-[9px] font-black uppercase tracking-widest ${isDark ? "text-slate-600" : "text-slate-400"}`}>{group}</p>
              {options.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-[12px] font-bold transition ${value === opt ? "bg-indigo-500/20 text-indigo-400" : isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-50"
                    }`}
                >{opt}</button>
              ))}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
