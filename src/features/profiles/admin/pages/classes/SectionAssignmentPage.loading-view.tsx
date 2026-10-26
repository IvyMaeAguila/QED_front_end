import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingRegion } from '@shared/loading/LoadingRegion';
import { useLoadingOutletContext } from '@shared/loading/RoutePreview';
import type { AdminThemeContext } from '../AdminLayout';

export function SectionAssignmentPageComposition({ children }: { children?: ReactNode }) {
  const theme = useLoadingOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  return <div className="w-full space-y-6 pb-12">
    <header className="space-y-2">
      <button type="button" onClick={() => navigate('/admin/classes')} className={`qed-type-button ${theme.textMuted}`}>← Back to Classes Management</button>
      <h1 className={`qed-type-page-title ${theme.textPrimary}`}>Section Assignment</h1>
      <p className={`qed-type-page-description ${theme.textMuted}`}>Manage student section assignments for the active school year.</p>
    </header>
    {children === undefined ? <LoadingRegion loading skeleton={<p className={theme.textMuted}>Loading section assignments…</p>}>{null}</LoadingRegion> : children}
  </div>;
}
