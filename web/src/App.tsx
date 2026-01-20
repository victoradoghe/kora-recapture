import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { MetricsCards } from "./components/MetricsCards";
import { ControlPanel } from "./components/ControlPanel";
import { LogsViewer } from "./components/LogsViewer";
import { AccountsPage } from "./pages/AccountsPage";
import { ActiveReclaimPage } from "./pages/ActiveReclaimPage";
import { WhitelistPage } from "./pages/WhitelistPage";
import { LogsPage } from "./pages/LogsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { apiClient } from "./api/client";
import { Badge } from "./components/ui/badge";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});


function DashboardContent() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");

  // Fetch metrics for the accounts badge
  const { data: metrics } = useQuery({
    queryKey: ["metrics"],
    queryFn: apiClient.getMetrics,
    refetchInterval: 10000,
  });

  // Handle hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || "dashboard";
      setCurrentPage(hash);
      setIsMobileSidebarOpen(false);
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  // Render page based on current route
  const renderPage = () => {
    switch (currentPage) {
      case "accounts":
        return <AccountsPage />;
      case "active":
        return <ActiveReclaimPage />;
      case "whitelist":
        return <WhitelistPage />;
      case "logs":
        return <LogsPage />;
      case "settings":
        return <SettingsPage />;
      case "profile":
        return <ProfilePage />;
      case "dashboard":
      default:
        return (
          <>
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Reclaim Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Monitor and reclaim SOL from inactive sponsored accounts
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  ⏱ Recommended check: 24 hours
                </Badge>
                <Badge variant="outline" className="text-xs">
                  📊 {metrics?.accountsMonitored || 0} Accounts Monitored
                </Badge>
              </div>
            </div>

            {/* Section Title */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg md:text-xl font-semibold">Target Reclaim Metrics</h2>
              <div className="flex items-center gap-2 overflow-x-auto">
                <button className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium hover:bg-secondary/80 transition-colors whitespace-nowrap">
                  24H
                </button>
                <button className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium hover:bg-secondary/80 transition-colors whitespace-nowrap">
                  Proof of Stake
                </button>
                <button className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium hover:bg-secondary/80 transition-colors whitespace-nowrap">
                  Desc
                </button>
              </div>
            </div>

            {/* Metrics Cards */}
            <MetricsCards />

            {/* Your Active Reclaims Section */}
            <div className="mt-6 md:mt-8">
              <h2 className="text-lg md:text-xl font-semibold mb-4">Your active reclaims</h2>

              {/* Control Panel - Full Width */}
              <ControlPanel />
            </div>

            {/* Logs Viewer */}
            <LogsViewer />
          </>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        activePage={currentPage}
        isMobileOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto w-full lg:w-auto">
        <TopBar onMenuClick={() => setIsMobileSidebarOpen(true)} />

        <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6 space-y-4 md:space-y-6">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent />
    </QueryClientProvider>
  );
}

export default App;
