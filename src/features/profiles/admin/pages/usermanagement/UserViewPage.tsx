import { UserViewPageComposition } from "./UserViewPage.loading-view";
import { useUserQueries } from './hooks/useUserQueries';
export * from "./UserViewPage.loading-view";

export function UserViewPage() {
 useUserQueries();
 return <UserViewPageComposition/>;
}
