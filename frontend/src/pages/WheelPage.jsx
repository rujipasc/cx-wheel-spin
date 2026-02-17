import AppShell from "@/layout/AppShell";
import { useMemo, useRef, useState } from "react";
import SpinWheel from "@/components/SpinWheel";
import { useSession } from "@/state/session";

export default function WheelPage({ stats, fileName, currentPage, onNavigate }) {
  const { state, actions } = useSession();
  const isThai = state.settings.language === "th";
  const previewNames = state.remainingNames.length > 0 ? state.remainingNames : state.allNames;
  const [nameDraft, setNameDraft] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortMode, setSortMode] = useState("default");
  const latestSelected = [...state.results].reverse().find((row) => row.status === "Selected");
  const wheelNames = useMemo(
    () => (previewNames.length > 0 ? previewNames : []),
    [previewNames, isThai]
  );
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);
  const [winnerName, setWinnerName] = useState("");
  const wheelRef = useRef(null);
  const wheelSize = 500;

  const canSpin = state.settings.removeAfterSelected
    ? state.remainingNames.length > 0
    : state.allNames.length > 0;

  const handleSpin = () => {
    if (!canSpin || isSpinning) return;
    setWinnerModalOpen(false);
    wheelRef.current?.spin();
  };

  const handleWheelResult = (name) => {
    actions.spinByName(name);
    setWinnerName(name);
    setWinnerModalOpen(true);
  };

  const visibleNames = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let list = previewNames;
    if (term) {
      list = list.filter((name) => String(name).toLowerCase().includes(term));
    }
    if (sortMode === "az") {
      return [...list].sort((a, b) => String(a).localeCompare(String(b)));
    }
    if (sortMode === "za") {
      return [...list].sort((a, b) => String(b).localeCompare(String(a)));
    }
    return list;
  }, [previewNames, searchTerm, sortMode]);

  const handleAddName = () => {
    const next = nameDraft.trim();
    if (!next) return;
    actions.addName(next);
    setNameDraft("");
  };

  return (
    <AppShell
      stats={stats}
      fileName={fileName}
      currentPage={currentPage}
      onNavigate={onNavigate}
    >
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Wheel stage */}
        <section className="col-span-12 lg:col-span-8">
          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-4xl">
              <h1 className="mt-4 mb-6 text-center text-3xl font-semibold tracking-tight lg:mt-6">
                Wheel of <span className="text-cyan-600 dark:text-cyan-300">Names</span>
              </h1>

              <div className="relative rounded-[28px] border border-slate-300/80 bg-slate-100/75 p-6 shadow-[0_14px_35px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/15 dark:bg-black dark:shadow-none">
                {/* wheel placeholder */}
                <div className="mx-auto mt-6 w-fit">
                  <SpinWheel
                    ref={wheelRef}
                    names={wheelNames}
                    spinning={isSpinning}
                    size={wheelSize}
                    onSpinStart={() => setIsSpinning(true)}
                    onSpinEnd={() => setIsSpinning(false)}
                    onResult={handleWheelResult}
                  />
                </div>

                <div className="mt-4 text-center text-xs text-slate-500 dark:text-white/50">
                  {isThai
                    ? "กดที่วงล้อ (หรือปุ่ม Spin) เพื่อสุ่ม"
                    : "Click the wheel (or press Spin) to random"}
                </div>
                <div className="mt-2 text-center text-sm">
                  <span className="text-slate-500 dark:text-white/55">
                    {isThai ? "ผู้ที่ถูกเลือกล่าสุด:" : "Latest selected:"}
                  </span>{" "}
                  <span className="font-semibold text-cyan-700 dark:text-cyan-300">
                    {latestSelected?.name || (isThai ? "-" : "-")}
                  </span>
                </div>

                <div className="mt-5 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleSpin}
                    disabled={!canSpin || isSpinning}
                    className="rounded-xl bg-cyan-600 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-cyan-500 dark:text-black dark:hover:bg-cyan-400"
                  >
                    {isSpinning ? (isThai ? "กำลังหมุน..." : "Spinning...") : isThai ? "สุ่ม (Spin)" : "Spin"}
                  </button>
                  <button
                    type="button"
                    onClick={actions.undo}
                    disabled={state.drawHistory.length === 0}
                    className="rounded-xl border border-slate-300 bg-white/80 px-5 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-black dark:text-white/80 dark:hover:bg-white/10"
                  >
                    {isThai ? "ย้อนกลับ (Undo)" : "Undo"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Control panel */}
        <aside className="col-span-12 lg:col-span-4 lg:pt-21">
          <div className="rounded-[22px] border border-slate-300/80 bg-slate-100/75 p-4 shadow-[0_14px_35px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/15 dark:bg-black dark:shadow-none">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold tracking-wide text-slate-700 dark:text-white/80">
                {`NAMES (${previewNames.length})`}
              </div>
              <button className="text-xs text-slate-500 hover:text-slate-800 dark:text-white/50 dark:hover:text-white">
                ⋯
              </button>
            </div>

            <div className="mb-3 flex gap-2">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddName();
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-cyan-500/40 dark:border-white/15 dark:bg-black dark:text-white dark:placeholder:text-white/30 dark:focus:border-cyan-400/30"
                placeholder="Add a name..."
              />
              <button
                type="button"
                onClick={handleAddName}
                className="rounded-xl bg-cyan-600 px-3 text-sm font-semibold text-white hover:bg-cyan-500 dark:bg-cyan-500 dark:text-black dark:hover:bg-cyan-400"
              >
                +
              </button>
            </div>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-cyan-500/40 dark:border-white/15 dark:bg-black dark:text-white dark:placeholder:text-white/30"
                placeholder={isThai ? "ค้นหาชื่อ..." : "Search names..."}
              />
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none dark:border-white/15 dark:bg-black dark:text-white"
              >
                <option value="default">{isThai ? "เรียงตามเดิม" : "Default order"}</option>
                <option value="az">{isThai ? "เรียง A-Z" : "Sort A-Z"}</option>
                <option value="za">{isThai ? "เรียง Z-A" : "Sort Z-A"}</option>
              </select>
            </div>

            <div
              className="space-y-2 overflow-y-auto pr-1"
              style={{ height: wheelSize }}
            >
              {visibleNames.length === 0 && (
                <div className="rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-sm text-slate-500 dark:border-white/15 dark:bg-black dark:text-white/60">
                  {isThai ? "ไม่พบรายชื่อที่ต้องการ" : "No matching names found."}
                </div>
              )}
              {visibleNames.map((n) => (
                <div
                  key={n}
                  className="flex items-center justify-between rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-sm text-slate-700 dark:border-white/15 dark:bg-black dark:text-white/80"
                >
                  <span>{n}</span>
                  <span className="text-xs text-slate-400 dark:text-white/40">•</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {winnerModalOpen && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/55 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-cyan-400/35 bg-slate-950/92 p-6 text-center shadow-[0_0_40px_rgba(34,211,238,0.25)]">
            <button
              type="button"
              onClick={() => setWinnerModalOpen(false)}
              className="absolute right-3 top-2 text-lg text-white/50 hover:text-white"
            >
              ×
            </button>
            <div className="text-xs font-semibold tracking-[0.2em] text-cyan-300">
              {isThai ? "ผู้ชนะ" : "WINNER"}
            </div>
            <div className="mt-2 text-4xl font-bold text-white">{winnerName}</div>
            <button
              type="button"
              onClick={() => setWinnerModalOpen(false)}
              className="mt-6 rounded-xl bg-cyan-500 px-5 py-2 text-sm font-semibold text-black hover:bg-cyan-400"
            >
              {isThai ? "รับทราบ" : "Close"}
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
