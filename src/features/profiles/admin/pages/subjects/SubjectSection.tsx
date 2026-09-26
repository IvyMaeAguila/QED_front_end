// SubjectsSection.tsx
import { Outlet, useOutletContext } from "react-router-dom";
import { GradeLevelsProvider } from "./context/gradeLevelsContext";
import { SubjectsCatalogProvider } from "./context/SubjectsCatalogContext";
import { SectionsProvider } from "./context/SectionsContext";
import { SubjectSectionsProvider } from "./context/SubjectSectionsContext";
import type { AdminThemeContext } from "../AdminLayout";

export function SubjectsSection() {
  const theme = useOutletContext<AdminThemeContext>();

  return (
    <GradeLevelsProvider>
      <SubjectsCatalogProvider>
        <SectionsProvider>
          <SubjectSectionsProvider>
            <Outlet context={theme} />
          </SubjectSectionsProvider>
        </SectionsProvider>
      </SubjectsCatalogProvider>
    </GradeLevelsProvider>
  );
}