import AppShell from "@/layout/AppShell";
import { useMemo, useRef, useState } from "react";
import { extractNameColumn, parseCsvToRows } from "@/lib/importParsers";
import { useSession } from "@/state/session";
import { hasNativeBridge, pickImportPreviewNative } from "@/lib/nativeBridge";

function guessNameColumnIndex(headerRow) {
  if (!Array.isArray(headerRow) || headerRow.length === 0) return 0;
  const keywords = ["name", "full name", "employee name", "ชื่อ", "ชื่อ-นามสกุล"];
  const idx = headerRow.findIndex((raw) => {
    const value = String(raw || "").toLowerCase().trim();
    return keywords.some((k) => value.includes(k));
  });
  return idx >= 0 ? idx : 0;
}

export default function ImportPage({ stats, fileName, currentPage, onNavigate }) {
  const { state, actions } = useSession();
  const [rawRows, setRawRows] = useState([]);
  const [columnIndex, setColumnIndex] = useState(0);
  const [skipHeader, setSkipHeader] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef(null);

  const isThai = state.settings.language === "th";
  const previewNames = useMemo(
    () => extractNameColumn(rawRows, columnIndex, skipHeader),
    [rawRows, columnIndex, skipHeader]
  );
  const headerRow = rawRows[0] || [];

  const openPicker = async () => {
    if (hasNativeBridge()) {
      const payload = await pickImportPreviewNative();
      if (!payload) return;

      const lowerName = String(payload.name || "").toLowerCase();
      setImportError("");
      setSelectedFile({ name: payload.name });

      if (lowerName.endsWith(".csv") || lowerName.endsWith(".xlsx")) {
        const rows = Array.isArray(payload.rows) ? payload.rows : [];
        setRawRows(rows);
        setColumnIndex(guessNameColumnIndex(rows[0] || []));
        return;
      }
    }

    fileInputRef.current?.click();
  };

  const handleFile = async (file) => {
    if (!file) return;
    const lowerName = file.name.toLowerCase();
    setImportError("");
    setSelectedFile(file);

    if (lowerName.endsWith(".csv")) {
      const text = await file.text();
      const rows = parseCsvToRows(text);
      setRawRows(rows);
      setColumnIndex(guessNameColumnIndex(rows[0] || []));
      return;
    }

    if (lowerName.endsWith(".xlsx")) {
      setRawRows([]);
      setImportError(
        isThai
          ? "โหมด Browser (localhost:5173) ยังอ่าน XLSX ไม่ได้ กรุณารันผ่าน Wails Desktop หรือแปลงเป็น CSV ชั่วคราว"
          : "XLSX parsing is not available in browser mode (localhost:5173). Please run via Wails Desktop or use CSV."
      );
      return;
    }

    setImportError("Unsupported file type. Please use CSV or XLSX.");
  };

  const applyToSession = () => {
    if (previewNames.length === 0) return;
    actions.importNames(previewNames, selectedFile?.name || fileName);
  };

  return (
    <AppShell
      stats={stats}
      fileName={fileName}
      currentPage={currentPage}
      onNavigate={onNavigate}
    >
      <div className="mt-6 grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-7">
          <div className="rounded-[22px] border border-slate-300/80 bg-slate-100/75 p-5 shadow-[0_14px_35px_rgba(15,23,42,0.08)] dark:border-white/15 dark:bg-black">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              {isThai ? "นำเข้าข้อมูลรายชื่อ" : "Import Data"}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-white/60">
              {isThai
                ? "อัปโหลด CSV/XLSX และเตรียมรายชื่อก่อนเริ่มสุ่ม"
                : "Upload CSV/XLSX and prepare names before running Wheel."}
            </p>

            <div className="mt-5 rounded-xl border border-dashed border-cyan-500/45 bg-cyan-50/60 p-6 text-center dark:border-cyan-400/35 dark:bg-cyan-500/10">
              <div className="text-sm font-semibold text-cyan-800 dark:text-cyan-200">
                {isThai ? "เลือกไฟล์ CSV หรือ XLSX" : "Drop CSV or XLSX here"}
              </div>
              <div className="mt-1 text-xs text-cyan-700/80 dark:text-cyan-100/75">
                {isThai
                  ? "รองรับไฟล์รายชื่อจาก HR พร้อมเลือก Sheet และ Column"
                  : "Supports HR file intake with sheet and column mapping"}
              </div>
              <button
                type="button"
                onClick={openPicker}
                className="mt-4 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 dark:bg-cyan-500 dark:text-black"
              >
                {isThai ? "เลือกไฟล์" : "Upload File"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <select
                value={columnIndex}
                onChange={(e) => setColumnIndex(Number(e.target.value))}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-white/15 dark:bg-black dark:text-white"
              >
                {headerRow.length === 0 && (
                  <option value={0}>
                    {isThai ? "Column: ยังไม่มีข้อมูล" : "Column: no data loaded"}
                  </option>
                )}
                {headerRow.map((colName, idx) => (
                  <option key={`${colName}-${idx}`} value={idx}>
                    {`Column ${idx + 1}${colName ? `: ${colName}` : ""}`}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-white/15 dark:bg-black dark:text-white">
                <input
                  type="checkbox"
                  checked={skipHeader}
                  onChange={(e) => setSkipHeader(e.target.checked)}
                  className="accent-cyan-600"
                />
                {isThai ? "มี Header Row" : "Has header row"}
              </label>
            </div>
            {importError && (
              <div className="mt-3 rounded-lg border border-rose-400/50 bg-rose-100/80 px-3 py-2 text-xs text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                {importError}
              </div>
            )}
            <div className="mt-4">
              <button
                type="button"
                onClick={applyToSession}
                disabled={previewNames.length === 0}
                className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-cyan-500 dark:text-black"
              >
                {isThai ? "Apply to current session" : "Apply to current session"}
              </button>
            </div>
          </div>
        </section>

        <aside className="col-span-12 lg:col-span-5">
          <div className="rounded-[22px] border border-slate-300/80 bg-slate-100/75 p-5 shadow-[0_14px_35px_rgba(15,23,42,0.08)] dark:border-white/15 dark:bg-black">
            <h2 className="text-sm font-semibold tracking-wide text-slate-700 dark:text-white/85">
              {isThai ? "ตัวเลือกทำความสะอาดข้อมูล" : "Intake Options"}
            </h2>
            <div className="mt-3 space-y-2 text-sm">
              {[
                { key: "trimWhitespace", label: isThai ? "ตัดช่องว่างหัวท้าย" : "Trim whitespace" },
                { key: "deduplicate", label: isThai ? "ลบชื่อซ้ำ" : "Deduplicate names" },
                { key: "ignoreBlankRows", label: isThai ? "ข้ามบรรทัดว่าง" : "Ignore blank rows" },
              ].map((item) => {
                const checked = Boolean(state.settings[item.key]);
                return (
                  <label key={item.key} className="flex items-center gap-2 text-slate-700 dark:text-white/80">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => actions.setSetting(item.key, e.target.checked)}
                      className="accent-cyan-600"
                    />
                    {item.label}
                  </label>
                );
              })}
            </div>

            <h2 className="mt-5 text-sm font-semibold tracking-wide text-slate-700 dark:text-white/85">
              {isThai
                ? `ตัวอย่างรายชื่อ (${previewNames.length})`
                : `Preview (${previewNames.length})`}
            </h2>
            <div className="mt-2 space-y-2">
              {previewNames.slice(0, 12).map((name, idx) => (
                <div
                  key={`${name}-${idx}`}
                  className="rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-sm text-slate-700 dark:border-white/15 dark:bg-black dark:text-white/80"
                >
                  {name}
                </div>
              ))}
              {previewNames.length === 0 && (
                <div className="rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-sm text-slate-500 dark:border-white/15 dark:bg-black dark:text-white/50">
                  {isThai ? "ยังไม่มีข้อมูลสำหรับ preview" : "No rows to preview yet."}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
