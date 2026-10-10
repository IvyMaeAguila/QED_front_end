import { createContext, useContext, useEffect, type EffectCallback, type DependencyList } from "react";
import { useOutletContext } from "react-router-dom";

/** A route fallback renders the same layout, without starting its page effects. */
export const RoutePreviewContext = createContext(false);
export const RoutePreviewOutletContext = createContext<unknown>(null);
export const useRoutePreview = () => useContext(RoutePreviewContext);
export function useLoadingOutletContext<T>() {
  const outlet = useOutletContext<T>();
  const preview = useContext(RoutePreviewOutletContext);
  return (preview ?? outlet) as T;
}
export function useRouteEffect(effect: EffectCallback, dependencies?: DependencyList) {
  const preview = useRoutePreview();
  useEffect(() => {
    if (!preview) return effect();
  }, dependencies ? [preview, ...dependencies] : undefined);
}
