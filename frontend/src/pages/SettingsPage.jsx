import AppShell from "@/layout/AppShell";
import { useSession } from "@/state/session";
import { getTheme, setTheme } from "@/layout/theme";
import { useState } from "react";

function SettingCard({ title, children }) {
  return (
    <section className="mt-6 rounded-[18px] border border-slate-300/80 bg-white/75 p-4 dark:border-white/15 dark:bg-black">
      <h2 className="text-sm font-semibold tracking-wide text-slate-700 dark:text-white/85">
        {title}
      </h2>
      <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-white/80">{children}</div>
    </section>
  );
}

export default function SettingsPage({ stats, fileName, currentPage, onNavigate }) {
  const { state, actions } = useSession();
  const [themeMode, setThemeMode] = useState(getTheme());
  const isThai = state.settings.language === "th";

  const onThemeChange = (mode) => {
    setThemeMode(mode);
    setTheme(mode);
  };

  return (
    <AppShell
      stats={stats}
      fileName={fileName}
      currentPage={currentPage}
      onNavigate={onNavigate}
    >
      <div className="grid grid-cols-12 gap-6">
        <div className="mt-6 col-span-12">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            {isThai ? "ตั้งค่าระบบ / Governance" : "Settings / Governance"}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-white/60">
            {isThai
              ? "ปรับพฤติกรรมการสุ่ม นโยบาย และค่าพื้นฐานการใช้งาน"
              : "Configure draw behavior, policy, and UX defaults."}
          </p>
        </div>

        <div className="col-span-12 lg:col-span-6 space-y-4">
          <SettingCard title="Spin Behavior">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="spin-behavior"
                checked={state.settings.removeAfterSelected}
                onChange={() => actions.setSetting("removeAfterSelected", true)}
                className="accent-cyan-600"
              />
              {isThai ? "นำชื่อออกหลังถูกเลือก" : "Remove name after selected"}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="spin-behavior"
                checked={!state.settings.removeAfterSelected}
                onChange={() => actions.setSetting("removeAfterSelected", false)}
                className="accent-cyan-600"
              />
              {isThai ? "อนุญาตชื่อซ้ำ" : "Allow duplicate"}
            </label>
          </SettingCard>

          <SettingCard title="Animation">
            <label className="block">
              <div className="mb-1 text-xs text-slate-500 dark:text-white/60">Speed</div>
              <input type="range" min="1" max="10" defaultValue="6" className="w-full accent-cyan-600" />
            </label>
            <select className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-black">
              <option>Easing: Ease Out</option>
              <option>Easing: Linear</option>
              <option>Easing: Ease In Out</option>
            </select>
          </SettingCard>
        </div>

        <div className="col-span-12 lg:col-span-6 space-y-4">
          <SettingCard title="Theme">
            <div className="grid grid-cols-3 gap-2">
              {["light", "dark", "system"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onThemeChange(mode)}
                  className={[
                    "rounded-lg border px-3 py-2 text-sm",
                    themeMode === mode
                      ? "border-cyan-500/40 bg-cyan-500/12 text-cyan-700 dark:text-cyan-200"
                      : "border-slate-300 bg-white text-slate-700 dark:border-white/15 dark:bg-black dark:text-white/80",
                  ].join(" ")}
                >
                  {mode}
                </button>
              ))}
            </div>
          </SettingCard>

          <SettingCard title="Language">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="lang"
                checked={state.settings.language === "th"}
                onChange={() => actions.setSetting("language", "th")}
                className="accent-cyan-600"
              />
              ไทย
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="lang"
                checked={state.settings.language === "en"}
                onChange={() => actions.setSetting("language", "en")}
                className="accent-cyan-600"
              />
              English
            </label>
          </SettingCard>

          <SettingCard title="Session / Data Policy">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="accent-cyan-600" />
              Auto clear when close app
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="accent-cyan-600" />
              Confirm before reset session
            </label>
            <select className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-black">
              <option>Export format: XLSX</option>
              <option>Export format: CSV</option>
            </select>
          </SettingCard>
        </div>
      </div>
    </AppShell>
  );
}
