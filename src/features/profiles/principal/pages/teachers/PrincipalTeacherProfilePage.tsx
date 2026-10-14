import { QueryClientProvider } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { queryClient } from "@shared/query/queryClient";
import { usePrincipalTeacherProfile } from "./hooks/usePrincipalTeacherProfile";
import { TeacherSchedulePageComposition as SharedTeacherSchedulePage } from "./TeacherSchedulePage.loading-view";

function PrincipalTeacherProfileContent() {
  const { teacherId } = useParams<{ teacherId: string }>();
  const state = usePrincipalTeacherProfile(teacherId ? decodeURIComponent(teacherId) : undefined);
  return <SharedTeacherSchedulePage serverState={state} />;
}

export function TeacherSchedulePageComposition() {
  return <QueryClientProvider client={queryClient}><PrincipalTeacherProfileContent /></QueryClientProvider>;
}

export const TeacherSchedulePage = TeacherSchedulePageComposition;
