// SubjectsSection.tsx
import { Outlet } from "react-router-dom";
import { lazy,Suspense,useCallback,useState } from "react";
import { RouteSkeleton } from "@shared/loading/RouteSkeleton";
import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import { GradeLevelsProvider } from "./context/gradeLevelsContext";
import { SubjectsCatalogProvider } from "./context/SubjectsCatalogContext";
import { SectionsProvider } from "./context/SectionsContext";
import { SubjectSectionsProvider } from "./context/SubjectSectionsContext";
import type { AdminThemeContext } from "../AdminLayout";
import {AdminSubjectOperationsContext,pendingSubjects,type AdminSubjectsBridge} from '../../query/AdminSubjectOperations';
import {AdminSessionBoundary} from '../../query/AdminSessionBoundary';
import {useAuth} from '@shared/hooks/useAuth';
import {useRoutePreview} from '@shared/loading/RoutePreview';
const Queries=lazy(()=>import('../../query/AdminSubjectsQueries'));

function SubjectSession() {
  const theme = useOutletContext<AdminThemeContext>();
  const {user,isLoading}=useAuth(),preview=useRoutePreview();
  const [snapshot,setSnapshot]=useState<AdminSubjectsBridge>();
  const publish=useCallback((value:AdminSubjectsBridge|undefined)=>setSnapshot(value),[]);
  const bridge=snapshot??pendingSubjects;

  return (
    <GradeLevelsProvider value={bridge.grades}>
      <SubjectsCatalogProvider value={bridge.catalog}>
        <SectionsProvider value={bridge.sections}>
          <SubjectSectionsProvider value={bridge.assignments}>
           <AdminSubjectOperationsContext.Provider value={bridge.operations}>
            {!preview&&!isLoading&&user?.role==='ADMIN'&&<Suspense fallback={null}><Queries publish={publish}/></Suspense>}
            <Suspense fallback={<RouteSkeleton outletContext={theme} />}>
              <Outlet context={theme} />
            </Suspense>
           </AdminSubjectOperationsContext.Provider>
          </SubjectSectionsProvider>
        </SectionsProvider>
      </SubjectsCatalogProvider>
    </GradeLevelsProvider>
  );
}
export function SubjectsSection(){return <AdminSessionBoundary resource="subjects"><SubjectSession/></AdminSessionBoundary>;}
