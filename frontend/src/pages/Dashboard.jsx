export default function Dashboard() {
  return (
    <div className="mx-auto max-w-7xl p-4 grid grid-cols-12 gap-4">
      {/* LEFT */}
      <div className="col-span-12 lg:col-span-4 rounded-xl border bg-card p-4">
        <h2 className="font-semibold mb-2">Upload & Preview</h2>
        <button className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
          Upload CSV / XLSX
        </button>
      </div>

      {/* CENTER */}
      <div className="col-span-12 lg:col-span-5 rounded-xl border bg-card p-4">
        <h2 className="font-semibold mb-2">Wheel</h2>
        <div className="h-80 rounded-xl border bg-muted/30 flex items-center justify-center">
          Wheel Canvas
        </div>
        <button className="mt-4 w-full rounded-lg bg-primary py-2 text-primary-foreground">
          Spin
        </button>
      </div>

      {/* RIGHT */}
      <div className="col-span-12 lg:col-span-3 rounded-xl border bg-card p-4">
        <h2 className="font-semibold mb-2">Results</h2>
        <button className="w-full rounded-lg bg-secondary py-2">
          Export Excel
        </button>
      </div>
    </div>
  );
}