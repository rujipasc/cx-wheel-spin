import AppShell from "@/layout/AppShell";
import { useSession } from "@/state/session";
import {
  hasNativeBridge,
  saveFileBase64Native,
  saveResultsXlsxNative,
} from "@/lib/nativeBridge";

export default function ResultsPage({ stats, fileName, currentPage, onNavigate }) {
  const { state, actions } = useSession();
  const isThai = state.settings.language === "th";

  const exportCsv = async () => {
    if (state.results.length === 0) return;
    const header = "No,Name,Timestamp\n";
    const body = state.results
      .filter((row) => row.status === "Selected")
      .map((row) => `${row.no},"${row.name.replace(/"/g, '""')}",${row.timestamp}`)
      .join("\n");
    const csvText = header + body;

    if (hasNativeBridge()) {
      const bytes = new TextEncoder().encode(csvText);
      let binary = "";
      bytes.forEach((b) => {
        binary += String.fromCharCode(b);
      });
      await saveFileBase64Native("wheel-results.csv", btoa(binary));
      return;
    }

    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wheel-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportXlsx = async () => {
    if (state.results.length === 0) return;
    if (!hasNativeBridge()) return;

    const rows = state.results
      .filter((row) => row.status === "Selected")
      .map((row) => ({
        no: row.no,
        name: row.name,
        timestamp: row.timestamp,
      }));

    await saveResultsXlsxNative("wheel-results.xlsx", rows);
  };

  return (
    <AppShell
      stats={stats}
      fileName={fileName}
      currentPage={currentPage}
      onNavigate={onNavigate}
    >
      <section className="mt-6 rounded-[22px] border border-slate-300/80 bg-slate-100/75 p-5 shadow-[0_14px_35px_rgba(15,23,42,0.08)] dark:border-white/15 dark:bg-black">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              {isThai ? "ผลการสุ่มและ Audit Trail" : "Results & Audit Trail"}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-white/60">
              {isThai
                ? "หลักฐานผลการสุ่มสำหรับ export และตรวจสอบย้อนหลัง"
                : "Evidence for compliance, export, and post-draw review."}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:bg-black dark:text-white/80"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={exportXlsx}
              disabled={!hasNativeBridge() || state.results.length === 0}
              className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-cyan-500 dark:text-black"
            >
              Export XLSX
            </button>
            <button
              type="button"
              onClick={actions.clearResults}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:bg-black dark:text-white/80"
            >
              {isThai ? "ล้างผล" : "Clear"}
            </button>
            <button
              type="button"
              onClick={actions.resetSession}
              className="rounded-xl border border-rose-400/50 bg-rose-100/80 px-4 py-2 text-sm text-rose-700 hover:bg-rose-200 dark:bg-rose-500/15 dark:text-rose-300"
            >
              {isThai ? "เริ่มรอบใหม่" : "New Round"}
            </button>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-300 dark:border-white/15">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-200/70 text-slate-700 dark:bg-white/10 dark:text-white/80">
              <tr>
                <th className="px-3 py-2 text-left">No.</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Date / Time</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {state.results.map((row) => (
                <tr
                  key={`${row.no}-${row.name}`}
                  className="border-t border-slate-300 bg-white/70 text-slate-700 dark:border-white/10 dark:bg-black dark:text-white/80"
                >
                  <td className="px-3 py-2">{row.no}</td>
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2">{row.timestamp}</td>
                  <td className="px-3 py-2">
                    <span
                      className={[
                        "rounded-md px-2 py-0.5 text-xs",
                        row.status === "Selected"
                          ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-200"
                          : "bg-amber-500/20 text-amber-700 dark:text-amber-200",
                      ].join(" ")}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
              {state.results.length === 0 && (
                <tr className="border-t border-slate-300 bg-white/70 text-slate-500 dark:border-white/10 dark:bg-black dark:text-white/55">
                  <td className="px-3 py-3" colSpan={4}>
                    {isThai ? "ยังไม่มีผลการสุ่ม" : "No draw results yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-xl border border-slate-300 bg-white/70 p-3 text-xs text-slate-500 dark:border-white/15 dark:bg-black dark:text-white/55">
          Internal Use Only • Rujipas Chorfah • Senior Professional HRIS & Shared Service • People Group
        </div>
      </section>
    </AppShell>
  );
}
