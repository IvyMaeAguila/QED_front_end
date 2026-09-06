interface DashboardStatusProps {
  loading: boolean;
  error: string | null;
  panelBg: string;
  panelBorder: string;
  textMuted: string;
}

export function DashboardStatus({ loading, error, panelBg, panelBorder, textMuted }: DashboardStatusProps) {
  return (
    <div className={`rounded-2xl border ${panelBg} ${panelBorder} p-8 text-center shadow-card`}>
      <p className={`text-sm ${textMuted}`}>{error ? error : loading ? "Loading…" : null}</p>
    </div>
  );
}
