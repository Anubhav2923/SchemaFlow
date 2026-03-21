import type { Dispatch, SetStateAction, FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";

interface GuestDashboardProps {
  projectCount: number;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  description: string;
  setDescription: Dispatch<SetStateAction<string>>;
  isPending: boolean;
}

export function GuestDashboard({
  projectCount,
  handleSubmit,
  name,
  setName,
  description,
  setDescription,
  isPending,
}: GuestDashboardProps) {
  return (
    <div className="flex-1 w-full bg-[var(--page-bg)] selection:bg-indigo-500 selection:text-white">
      <main className="mx-auto max-w-[1600px] px-8 py-20">
        <section className="grid gap-16 lg:grid-cols-2 items-center">
          <div className="relative">
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[0.95] text-[var(--ink-strong)]">
              Model your<br />
              <span className="text-indigo-500">physical world.</span>
            </h1>
            <p className="mt-8 text-lg font-bold text-[var(--ink-muted)] leading-relaxed max-w-lg opacity-80">
              The ultimate workspace for visual database architects. Build schemas, manage relationships, and export SQL in a nebula-inspired environment.
            </p>

            <div className="mt-12 flex flex-wrap gap-4">
              <div className="p-5 rounded-2xl border border-[var(--line-soft)] bg-[var(--panel)] shadow-sm">
                <span className="block text-2xl font-black text-indigo-500">{projectCount}+</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active projects</span>
              </div>
              <div className="p-5 rounded-2xl border border-[var(--line-soft)] bg-[var(--panel)] shadow-sm">
                <span className="block text-2xl font-black text-emerald-500">100%</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Export Ready</span>
              </div>
            </div>
          </div>

          <div className="rounded-[40px] border border-[var(--line-soft)] bg-[var(--panel)] p-10 lg:p-16 shadow-3xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px]" />

            <p className="text-[11px] font-black uppercase tracking-widest text-indigo-500">Quick Initialization</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--ink-strong)]">Start Workspace</h2>
            <p className="mt-3 text-sm font-bold leading-relaxed text-[var(--ink-muted)] opacity-60">
              Enter your project details below to launch into the visual schema editor.
            </p>

            <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
              <Input
                label="Workspace Title"
                placeholder="Financial Engine"
                className="h-14 rounded-2xl border-2 px-6"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <Input
                label="Description"
                placeholder="Auth, Billing, and Users"
                className="h-14 rounded-2xl border-2 px-6"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              <Button
                type="submit"
                className="h-14 w-full rounded-2xl text-[11px] font-black uppercase tracking-widest bg-indigo-500 hover:bg-indigo-600 border-none"
                disabled={isPending}
              >
                Get Started Now
              </Button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
