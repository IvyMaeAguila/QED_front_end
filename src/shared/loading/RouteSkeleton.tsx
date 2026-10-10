import { matchRoutes, useLocation, useNavigate } from "react-router-dom";
import type { ComponentType } from "react";
import { useContext } from "react";
import { useAuth } from "../../features/auth/context/authContext";
import { routeSkeletons } from "./routeSkeletons";
import { RouteViewsContext } from "./RouteViewsContext";
import { RoutePreviewContext, RoutePreviewOutletContext } from "./RoutePreview";

/** Only mounted below the authenticated role shell (or for a public page). */
export function RouteSkeleton({ outletContext }: { outletContext?: unknown }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const routeViews = useContext(RouteViewsContext);
  const match = matchRoutes(Object.keys(routeSkeletons).map(path => ({ path })), location)?.at(-1);
  const key = match?.route.path as keyof typeof routeSkeletons | undefined;
  if (!key) return null;
  const entry = routeSkeletons[key];
  const View = routeViews[entry.skeleton] as ComponentType<Record<string, unknown>>;
  if (!View) throw new Error(`Missing ${entry.skeleton} in authenticated role views`);
  const role = user?.role?.toUpperCase() ?? "ADMIN";
  return <RoutePreviewContext.Provider value={true}>
    <RoutePreviewOutletContext.Provider value={outletContext}>
    <div data-route-skeleton={key} inert>
      <View audience={role} viewerRole={role} open={true} onClose={() => navigate("/")} />
    </div>
    </RoutePreviewOutletContext.Provider>
  </RoutePreviewContext.Provider>;
}
