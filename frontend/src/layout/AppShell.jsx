import { TopNav } from "./TopNav";
import { Watermark } from "@/components/watermark";

export default function AppShell({
  children,
  stats,
  fileName,
  currentPage,
  onNavigate,
}) {
  return (
    <div className="
        min-h-screen
        bg-[linear-gradient(180deg,#edf2f6,#e4ebf2)]
        text-slate-900
        dark:bg-none
        dark:bg-black
        dark:text-[hsl(var(--foreground))]
    ">
      {/* glow background */}
        <div className="pointer-events-none fixed inset-0 opacity-35 dark:opacity-20">
        <div className="absolute -top-32 left-1/2 h-120 w-180 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-40 left-16 h-90 w-90 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-105 w-130 rounded-full bg-blue-400/10 blur-3xl" />
      </div>

      <TopNav
        stats={stats}
        fileName={fileName}
        currentPage={currentPage}
        onNavigate={onNavigate}
      />

      {/* content */}
      <main className="relative mx-auto max-w-7xl px-5 pt-20 pb-8">
        {children}
      </main>

      <Watermark />
    </div>
  );
}
