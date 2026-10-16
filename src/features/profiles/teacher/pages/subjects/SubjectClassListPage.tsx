import { QueryClientProvider } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { queryClient } from "@shared/query/queryClient";
import { useTeacherReader } from "../../query/useTeacherReader";
import { subjectClassListService } from "./services/subjectClassList.service";
import { SubjectClassListPageComposition } from "./SubjectClassListPage.loading-view";
export { SubjectClassListPageComposition } from "./SubjectClassListPage.loading-view";
export type { SubjectClassListPageEffectScope, SubjectClassListPageRouteProps } from "./SubjectClassListPage.loading-view";
function ClassListQueries() {
  const { subjectSectionId } = useParams();
  const reader = useTeacherReader(["subjects", "roster", subjectSectionId ?? null], options => subjectClassListService.getClassList(Number(subjectSectionId), options), "Failed to load this class list.");
  return <SubjectClassListPageComposition reader={reader}/>;
}
export function SubjectClassListPage() { return <QueryClientProvider client={queryClient}><ClassListQueries/></QueryClientProvider>; }
