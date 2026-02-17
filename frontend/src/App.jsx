import { useMemo, useState } from "react";
import WheelPage from "@/pages/WheelPage";
import ImportPage from "@/pages/ImportPage";
import ResultsPage from "@/pages/ResultsPage";
import SettingsPage from "@/pages/SettingsPage";
import { SessionProvider, useSession } from "@/state/session";

export default function App() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  );
}

function AppContent() {
  const [currentPage, setCurrentPage] = useState("wheel");
  const { stats, state } = useSession();

  const pageMeta = useMemo(
    () => ({
      wheel: {
        component: WheelPage,
      },
      import: {
        component: ImportPage,
      },
      results: {
        component: ResultsPage,
      },
      settings: {
        component: SettingsPage,
      },
    }),
    []
  );

  const CurrentPage = pageMeta[currentPage].component;

  return (
    <CurrentPage
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      stats={stats}
      fileName={state.sourceFileName}
    />
  );
}
