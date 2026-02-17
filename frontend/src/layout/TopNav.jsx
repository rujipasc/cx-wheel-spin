import { useEffect, useState } from "react";
import { setTheme } from "./theme";
import logoLight from "@/assets/images/HRIS_LogoCardX_Light.png";
import logoDark from "@/assets/images/cx_HRIS_Logo_dark_t.png";
import { useSession } from "@/state/session";

export function TopNav({ stats, fileName, currentPage, onNavigate }) {
  const { state, actions } = useSession();
  const menu = [
    { label: "Wheel", key: "wheel" },
    { label: "Import", key: "import" },
    { label: "Results", key: "results" },
    { label: "Settings", key: "settings" },
  ];
  return (
    <header className="fixed top-0 left-0 right-0 z-30 border-b border-slate-300/70 bg-slate-100/80 backdrop-blur dark:border-white/15 dark:bg-black">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex w-34 flex-col items-center text-center">
            <img
              src={logoLight}
              alt="CardX HRIS Team"
              className="h-10 w-auto object-contain dark:hidden"
            />
            <img
              src={logoDark}
              alt="CardX HRIS Team"
              className="hidden h-10 w-auto object-contain dark:block"
            />
            <div className="mt-0.5 max-w-full truncate text-center text-[11px] text-slate-500 dark:text-white/60">
              {fileName || "No file loaded"}
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="hidden md:flex items-center gap-2">
          {menu.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => onNavigate?.(m.key)}
              className={[
                "rounded-lg border px-3 py-1.5 text-sm transition",
                currentPage === m.key
                  ? "border-cyan-500/35 bg-cyan-500/12 text-cyan-700 dark:border-cyan-400/35 dark:bg-cyan-500/20 dark:text-cyan-200"
                  : "border-transparent text-slate-600 hover:border-slate-300 hover:bg-slate-200/70 hover:text-slate-900 dark:text-white/70 dark:hover:border-white/15 dark:hover:bg-white/10 dark:hover:text-white",
              ].join(" ")}
            >
              {m.label}
            </button>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 dark:border-white/15 dark:bg-black">
            {[
              { key: "th", label: "TH" },
              { key: "en", label: "EN" },
            ].map((lang) => (
              <button
                key={lang.key}
                type="button"
                onClick={() => actions.setSetting("language", lang.key)}
                className={[
                  "rounded-md px-2 py-1 text-[11px] font-semibold",
                  state.settings.language === lang.key
                    ? "bg-cyan-500/20 text-cyan-700 dark:bg-cyan-500/25 dark:text-cyan-200"
                    : "text-slate-500 hover:text-slate-800 dark:text-white/60 dark:hover:text-white",
                ].join(" ")}
                title={lang.key === "th" ? "ภาษาไทย" : "English"}
              >
                {lang.label}
              </button>
            ))}
          </div>
          <ThemeToggle />
          <StatChip label="Total" value={stats?.total ?? 0} />
          <StatChip label="Remaining" value={stats?.remaining ?? 0} />
          <StatChip label="Selected" value={stats?.selected ?? 0} accent />
        </div>
      </div>
    </header>
  );
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    setTheme(nextIsDark ? "dark" : "light");
    setIsDark(nextIsDark);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 outline-none hover:bg-slate-100 dark:border-white/15 dark:bg-[#101a34] dark:text-white/85 dark:hover:bg-[#172444]"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M20.2 14.8A8.6 8.6 0 1 1 9.2 3.8a7.2 7.2 0 1 0 11 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.5v2.1M12 19.4v2.1M4.6 4.6l1.5 1.5M17.9 17.9l1.5 1.5M2.5 12h2.1M19.4 12h2.1M4.6 19.4l1.5-1.5M17.9 6.1l1.5-1.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StatChip({ label, value, accent }) {
  return (
    <div
      className={[
        "rounded-lg border px-2.5 py-1 text-xs",
        accent
          ? "border-cyan-500/35 bg-cyan-500/12 text-cyan-800 dark:border-cyan-400/30 dark:bg-cyan-500/15 dark:text-cyan-100"
          : "border-slate-300 bg-white/70 text-slate-700 dark:border-white/15 dark:bg-black dark:text-white/70",
      ].join(" ")}
    >
      <span className="mr-1 opacity-80">{label}:</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
