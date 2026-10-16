import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@shared/query/queryClient";
import { useTeacherReader } from "../../query/useTeacherReader";
import { assignedSubjectsService } from "./services/subjects.service";
import { SubjectsPageComposition } from "./SubjectPage.loading-view";
export { SubjectsPageComposition } from "./SubjectPage.loading-view";
export type { SubjectsPageEffectScope, SubjectsPageRouteProps } from "./SubjectPage.loading-view";
function SubjectsQueries() {
  const reader = useTeacherReader(["subjects", "assigned"], options => assignedSubjectsService.getAssignedSubjects(options), "Failed to load your subjects.");
  return <SubjectsPageComposition reader={reader}/>;
}
export function SubjectsPage() { return <QueryClientProvider client={queryClient}><SubjectsQueries/></QueryClientProvider>; }
