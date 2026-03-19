import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
};

export function Button({
  variant = "primary",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-xl text-center text-sm font-bold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

  const variants = {
    primary:
      "bg-[linear-gradient(135deg,var(--button-primary-from),var(--button-primary-to))] text-white shadow-lg shadow-[var(--button-shadow)] hover:shadow-xl hover:-translate-y-0.5",
    secondary:
      "border border-[var(--line-soft)] bg-[var(--panel)] text-[var(--ink-strong)] shadow-sm hover:bg-[var(--panel-soft)] hover:border-[var(--accent)]/30",
    ghost:
      "text-[var(--ink-muted)] hover:bg-[var(--panel-soft)] hover:text-[var(--ink-strong)]",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
