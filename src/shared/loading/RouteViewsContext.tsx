import { createContext } from "react";
import type { ComponentType } from "react";
/** Concrete views are supplied only by the authenticated role's imported module. */
export const RouteViewsContext = createContext<Record<string, ComponentType<any>>>({});
