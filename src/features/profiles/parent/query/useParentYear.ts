import { useParentReader } from './useParentReader';
import { fetchParentSchoolYear } from '../pages/Student/Overview/service/schoolYear.service';
export function useParentYear(enabled = true) {
  return useParentReader(['school-year', 'active'], fetchParentSchoolYear, 'Failed to load school year months.', enabled);
}
