import { useState, type ReactNode } from "react";
import logo from "../../assets/images/QED_Logo.png";
import { LoadingRegion } from "./LoadingRegion";

/** The sole brand-loading exception: the authenticated role is still unknown. */
export function QedBootstrapLoader({ loading, children }: { loading: boolean; children: ReactNode }) {
  const [allowed, setAllowed] = useState(false);
  const [previousLoading, setPreviousLoading] = useState(loading);
  if (previousLoading !== loading) {
    setPreviousLoading(loading);
    if (loading) setAllowed(false);
  }
  // Mount protected content once, after the gate has completely settled. The
  // loading region must not remain around the app or animate the real shell.
  if (allowed && !loading) return <>{children}</>;
  return <LoadingRegion name="auth-bootstrap" loading={loading}
    className="qed-bootstrap" label="Loading…"
    onSettled={() => { if (!loading) queueMicrotask(() => setAllowed(true)); }}
    skeleton={<div data-bootstrap-loader="QedBootstrapLoader" className="qed-bootstrap-brand" aria-hidden="true">
      <img src={logo} alt="" className="qed-bootstrap-logo" />
    </div>}>
    {null}
  </LoadingRegion>;
}
