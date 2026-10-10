// SubjectsSection.tsx
import { Outlet } from "react-router-dom";
import { Suspense } from "react";
import { RouteSkeleton } from "@shared/loading/RouteSkeleton";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
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
            <Suspense fallback={<RouteSkeleton outletContext={theme} />}>
              <Outlet context={theme} />
            </Suspense>
          </SubjectSectionsProvider>
        </SectionsProvider>
      </SubjectsCatalogProvider>
    </GradeLevelsProvider>
  );
}
