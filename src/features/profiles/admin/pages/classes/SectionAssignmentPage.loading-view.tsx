import { BackButton } from '../../../shared/components/DashboardUI';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingRegion } from '@shared/loading/LoadingRegion';
import { useLoadingOutletContext } from '@shared/loading/RoutePreview';
import type { AdminThemeContext } from '../AdminLayout';

export function SectionAssignmentPageComposition({ children }: { children?: ReactNode }) {
  const theme = useLoadingOutletContext<AdminThemeContext>();
  const navigate = useNavigate();
  return <div className="w-full space-y-6 pb-12">
    <header className="flex items-start gap-3">
      <BackButton onClick={() => navigate('/admin/classes')} panelBg={theme.panelBg} panelBorder={theme.panelBorder} />
      <div className="min-w-0 space-y-1">
        <h1 className={`qed-type-page-title ${theme.textPrimary}`}>Section Assignment</h1>
        <p className={`qed-type-page-description ${theme.textMuted}`}>Manage student section assignments for the active school year.</p>
      </div>
    </header>
    {children === undefined ? <LoadingRegion loading skeleton={<p className={theme.textMuted}>Loading section assignments…</p>}>{null}</LoadingRegion> : children}
  </div>;
}
