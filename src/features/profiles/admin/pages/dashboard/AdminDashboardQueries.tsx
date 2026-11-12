import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@shared/query/queryClient";
import { AdminOverview } from "./components/AdminOverview";
import { AdminDashboardHomeComposition } from "./AdminDashboardHome.loading-view";
import { AdminDashboardDataContext } from "./AdminDashboardDataContext";
import { useAdminDashboardQueries } from "./hooks/useAdminDashboardQueries";

function AdminDashboardQueries({ activity }: { activity: boolean }) {
  const data = useAdminDashboardQueries(activity ? "activity" : "summary");
  return <AdminDashboardDataContext.Provider value={data}><AdminDashboardHomeComposition activity={activity} overview={activity ? null : <AdminOverview />} /></AdminDashboardDataContext.Provider>;
}
export function AdminDashboardQueryBoundary({ activity = false }: { activity?: boolean }) {
  return <QueryClientProvider client={queryClient}><AdminDashboardQueries activity={activity}/></QueryClientProvider>;
}
