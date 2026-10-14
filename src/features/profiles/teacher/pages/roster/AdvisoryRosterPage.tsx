import { AdvisoryRosterPageComposition } from "./AdvisoryRosterPage.loading-view";
import { TeacherAdvisoryQueries } from "../../query/TeacherAdvisoryQueries";
export { AdvisoryRosterPageComposition } from "./AdvisoryRosterPage.loading-view";
export type { AdvisoryRosterPageEffectScope, AdvisoryRosterPageRouteProps } from "./AdvisoryRosterPage.loading-view";

export function AdvisoryRosterPage() {
 return <TeacherAdvisoryQueries><AdvisoryRosterPageComposition/></TeacherAdvisoryQueries>;
}
