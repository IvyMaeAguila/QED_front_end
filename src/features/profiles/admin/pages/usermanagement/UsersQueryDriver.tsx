import { useCallback, useLayoutEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@shared/query/queryClient';
import { useTeachers } from '../classes/context/TeachersContext';
import { clearTeacherProfileCache } from '../../../principal/pages/teachers/services/teachers.service';
import { useAdminUsersQueries } from './hooks/useAdminUsersQueries';
import type { UsersQueryDriverProps } from './context/UsersContext';
function Driver({ seed, publish, isCurrent }: UsersQueryDriverProps) {
  const { refetchTeachers } = useTeachers();
  const teacherChanged = useCallback(() => { clearTeacherProfileCache(); refetchTeachers(true); }, [refetchTeachers]);
  const value = useAdminUsersQueries(seed, isCurrent, teacherChanged);
  useLayoutEffect(() => { publish(value); }, [publish, value]);
  useLayoutEffect(() => () => publish(undefined), [publish]);
  return null;
}
export default function UsersQueryDriver(props: UsersQueryDriverProps) {
  return <QueryClientProvider client={queryClient}><Driver {...props}/></QueryClientProvider>;
}
