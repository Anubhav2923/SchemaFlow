import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ className = "", label, ...props }: InputProps) {
  return (
    <label className="flex w-full flex-col gap-2.5">
      {label && (
        <span className="ml-1 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--ink-faint)]">
          {label}
        </span>
      )}
      <input
        className={`w-full rounded-2xl border-2 border-[var(--line-soft)] bg-[var(--panel)] px-5 py-3.5 text-base font-semibold text-[var(--ink-strong)] outline-none transition duration-200 placeholder:font-medium placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--focus-ring-soft)] disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
        {...props}
      />
    </label>
  );
}
