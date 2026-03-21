import type { ReactNode } from "react";

interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function SidebarItem({ icon, label, active = false, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition-all duration-200 ${active
          ? "bg-[#6366f1]/10 text-[#6366f1]"
          : "text-[var(--ink-muted)] hover:bg-[var(--panel-soft)] hover:text-[var(--ink-strong)]"
        }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
