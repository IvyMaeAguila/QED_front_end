import { NavLink } from "react-router-dom";
import { ACCENT } from "../types/types";

interface AdminTopTabsProps {
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

const TABS = [
  { to: "/admin/subjects", label: "Subjects" },
  { to: "/admin/academic-year", label: "Academic Year" },
];

// Shared by ManageSubjectsPage and AcademicYearPage so the switcher behaves
// like real navigation (routes + browser history) instead of local tab state.
export function AdminTopTabs({
  panelBorder,
  textPrimary,
  textMuted,
}: AdminTopTabsProps) {
  return (
    <div className={`flex items-center gap-8 border-b ${panelBorder}`}>
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `relative pb-3 text-sm font-bold transition-colors ${
              isActive ? textPrimary : `${textMuted} hover:${textPrimary}`
            }`
          }
        >
          {({ isActive }) => (
            <>
              {tab.label}
              {isActive && (
                <span
                  className="absolute inset-x-0 -bottom-px h-0.5 rounded-full"
                  style={{ backgroundColor: ACCENT }}
                />
              )}
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}