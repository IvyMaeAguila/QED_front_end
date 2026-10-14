import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@shared/query/queryClient";
import { AdminDashboardHomeComposition } from "./AdminDashboardHome.loading-view";
import { AdminDashboardDataContext } from "./AdminDashboardDataContext";
import { useAdminDashboardQueries } from "./hooks/useAdminDashboardQueries";

export default function AdminDashboardQueries() {
  const data = useAdminDashboardQueries();
  return <AdminDashboardDataContext.Provider value={data}><AdminDashboardHomeComposition/></AdminDashboardDataContext.Provider>;
}
export function AdminDashboardQueryBoundary() {
  return <QueryClientProvider client={queryClient}><AdminDashboardQueries/></QueryClientProvider>;
}
