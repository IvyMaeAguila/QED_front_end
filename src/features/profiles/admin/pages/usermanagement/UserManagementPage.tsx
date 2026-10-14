import { UserManagementPageComposition } from "./UserManagementPage.loading-view";
import { useUserQueries } from './hooks/useUserQueries';
export * from "./UserManagementPage.loading-view";

export function UserManagementPage() {
 useUserQueries();
 return <UserManagementPageComposition/>;
}
