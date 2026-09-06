import { createContext, useContext, type ReactNode } from "react";

export interface SnapshotTheme {
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

export const defaultSnapshotTheme: SnapshotTheme = {
  darkMode: false,
  panelBg: "bg-white dark:bg-neutral-900",
  panelBorder: "border-neutral-200 dark:border-neutral-800",
  textPrimary: "text-neutral-900 dark:text-white",
  textMuted: "text-neutral-500 dark:text-neutral-400",
};

const SnapshotThemeContext = createContext<SnapshotTheme>(defaultSnapshotTheme);

/**
 * Optional provider. If you already have an app-wide theme (e.g. AdminThemeContext
 * from useOutletContext), just wrap this once near the top and pass its values in —
 * the card itself no longer needs react-router at all.
 */
export function SnapshotThemeProvider({
  value,
  children,
}: {
  value?: Partial<SnapshotTheme>;
  children: ReactNode;
}) {
  return (
    <SnapshotThemeContext.Provider value={{ ...defaultSnapshotTheme, ...value }}>
      {children}
    </SnapshotThemeContext.Provider>
  );
}

export function useSnapshotTheme() {
  return useContext(SnapshotThemeContext);
}