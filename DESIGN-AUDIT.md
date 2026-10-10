# QED loading design audit

Audit started 2026-10-08, before skeleton implementation. This document distinguishes
discovered regions from verified conversions; registration alone is not verification.

## Architecture and visual character

React 19, TypeScript, React Router 7, Vite 8, Tailwind CSS 4. No external UI component
library. `src/style.css` owns theme, typography and shared component rules.
`src/shared/components/SkeletonLoading.tsx` is the existing primitive and will be
extended, not replaced by a second skeleton system. Auth bootstrap and lazy chunks
currently use QedLoader/QedSplash. Data loading also occurs in contexts, hooks, page
effects and nested dialogs. Saving indicators must keep their real action controls.

The main academic UI is serious, moderately dense, softly rounded and subtly
elevated. Preserve the dark maroon glass sidebar and metallic edge. Neutral
skeletons should be quieter than the institutional accents. Parent quiz graphics
are intentionally playful; their real static illustrations are not placeholders.

## Palette

| Token / role | Light | Dark |
| --- | --- | --- |
| Page | `--surface-page: #EFEFEF` | `--surface-page-dark: #181818` |
| Card/modal | `--surface-card: #FFFFFF` | `--surface-card-dark: #242424` |
| Raised panel | white/light gray | `--surface-raised-dark: #303030` |
| Border | `--border-subtle: #DDDDDD` | `--border-subtle-dark: #444444` |
| Muted text | commonly gray-500 / #6B7280 | commonly white/50 to white/60 |
| Sidebar | `--sidebar-maroon`, primary mixed 65% with black, translucent layers | same |
| Brand | `--brand-primary: #710000`, `--brand-secondary: #860000` | same identity |

Semantic success, warning, error and informational colors are independent of the
brand. Do not use them for skeleton decoration. Scope skeleton neutral tokens on
maroon backgrounds; the light-page neutral cannot be reused on a dark sidebar.

## Geometry and typography

- Cards/dialogs: the theme aliases xl through 4xl to 1rem; many dashboard cards
  explicitly use 12px. Table frames and filter bars are normalized to 12px.
- Controls: 8px radius, compact filters 32px tall; larger ordinary controls retain
  their existing height. Navigation rows use 16px. Chips/avatars are fully round.
- Images: inherit the actual component radius and aspect ratio, never invent one.
- Inter 400/500/600/700. Body/labels/buttons/table cells 14px; metadata 13px;
  small metadata/badges 12px; card titles 16px; section titles 19px; page titles
  20–22px. Greeting 26–30px with 1.2 line height. Dialog title 18px/1.3.
- Body utilities generally have 20px line boxes; metadata uses its existing
  utility/token line height. Skeleton text must inherit font metrics and use 1lh,
  not simulate text with an arbitrary pixel-height bar.
- Spacing is the Tailwind 4px scale with compact 2/6/10px exceptions. Page gaps
  commonly 16/20/24px; card padding 16/20/24px; table cells 16px horizontal and
  8/10px vertical. Reuse those exact wrappers at every breakpoint.
- Common patterns: responsive stat grids; section cards with static headings;
  grouped directory tables; grade/subject card grids; two-column profile fields;
  filter strips; calendar month grids; fixed chart areas beside variable rankings;
  forms with dynamic options and optional role/section fields.

## Classification rule (approved amendment)

Classify by the cause of height, never by the component name. Numbers, avatars,
fixed-ratio images and bounded single-line controls can be FIXED. Wrapping names,
addresses, notes, descriptions, optional fields and returned item counts are
VARIABLE and carry `data-sk-variable`. Uncertain regions are VARIABLE. Mixed
components retain fixed geometry only for their genuinely fixed parts.

Variable lists: use page size when paginated, otherwise the last known count per
view, otherwise viewport-derived 3–6 rows; cap the reservation to visible rows.
Variable text: use cached line count per field, otherwise 2 address/name lines or
3 description/note lines. Reserve with visibility:hidden at mount. Only the swap
may change height, instantly; no truncation, new fixed dimensions or internal
scrolling is introduced. Actions remain real and above the dynamic region where
the current layout permits. Tests must reject fixed classifications whose loaded
height changes across short/typical/long fixtures.

## Page inventory and regions

F = fixed geometry independent of returned data. V = content-dependent height.
Lists use the row-count policy above; wrapping fields use the line-count policy.
Static titles, navigation, tabs, labels, headings and always-present actions are
real UI and are not skeleton regions. Shared role routes still require separate
route coverage. Dynamic parameters are route patterns, not omitted pages.

| Routes | Loaded regions and classification/reason | Count source |
| --- | --- | --- |
| `/`, `/login` | Landing is static; login fields F, error/status V; auth identity V, avatar F | No list |
| `/admin` | Count values F; frequency chart F plot / V labels; audit entries V; performance numbers F / V labels | Cache then viewport |
| `/admin/students` | Directory rows V; number/avatar F inside each row; returned names/metadata V | Existing page size, capped |
| `/admin/students/new`, `/admin/students/:studentId/edit` | Input controls F; option collections, optional sections and loaded free text V | Cache/typical field lines |
| `/admin/users` | User directory V; totals F; names/role-dependent fields V | Existing page size, capped |
| `/admin/users/new`, `/admin/users/:role/:userId/edit` | Controls F; role-dependent sections/options and text V | Cache/typical field lines |
| `/admin/users/:role/:userId` | Avatar F; identity/profile text, optional details V | Cache/typical field lines |
| `/admin/classes` | Class card collection V; counts F; names/assignment descriptions V | Cache then viewport |
| `/admin/classes/new`, `/admin/classes/:classId/edit` | Controls F; teacher/grade/section options and optional selections V | Cache/typical field lines |
| `/admin/classes/:classId` | Class information V; counts F; roster V | Cache then viewport |
| `/admin/subjects` | Subject cards V; fixed 218px assignment-card shell F where actually reused; titles/details optional V | Cache then viewport |
| `/admin/subjects/new`, `/admin/subjects/:subjectId` | Controls F; subject identity, sections, teacher assignments and template rows V | Cache then viewport |
| `/admin/academic-year` | Year/term data, optional cards and term rows V; single-line dates/controls F | Cache then viewport |
| `/admin/calendar`, `/principal/calendar` | Calendar grid F; variable event text/lists V; date controls F | Cache then viewport |
| `/admin/help`, `/principal/help`, `/teacher/help`, `/parent/help` | Static guide shell; feedback/status content V if loaded | No list |
| `/principal` | Overview numbers F; chart plots F; attendance/ranking/domain rows and labels V; wrapping greeting V | Cache then viewport |
| `/principal/students` | Grade card collection and optional sections V; counts F | Cache then viewport |
| `/principal/students/class/:classId`, `/principal/students/grade/:gradeId` | Class/grade identity V; grouped directory V; avatars/counts F | Cache then viewport |
| `/principal/teachers` | Teacher directory V; avatars F; names and details V | Cache then viewport |
| `/principal/teachers/:teacherId` | Teacher identity V/avatar F; timetable entries and roster collections V | Cache then viewport |
| `/principal/reports`, `/principal/holistic-performance-analytics` | Chart plots F; summaries, rankings, heatmap labels and optional insights V | Cache then viewport |
| `/principal/gradebooks` | Grouped gradebook collection V; existing assignment-card shells F; labels V | Cache then viewport |
| `/principal/gradebooks/:grade` | Grade/section metadata V; rating and student-group tables V; numeric cells F | Cache then viewport |
| `/teacher` | Greeting/name V; stat numbers F; attendance plot/counts F; schedule entries V; event collection V; date/calendar controls F | Cache then viewport; greeting typical 2 lines |
| `/teacher/attendance` | Section identity/choices V; student attendance rows V; avatar/count/enum controls F | Existing page size if present, else cache/viewport |
| `/teacher/attendance/records` | Section identity V; attendance month/day records V; calendar geometry F | Cache then viewport |
| `/teacher/subjects` | Grouped assignment collection V; assignment shells F; group headings/optional descriptions V | Cache then viewport |
| `/teacher/subjects/:subjectId` | Subject identity V; section collection and topic/assessment rows V; controls F | Cache then viewport |
| `/teacher/subjects/:subjectId/records` | Assessment/holistic columns and returned rows V; bounded numeric cells/controls F | Cache then viewport |
| `/teacher/subjects/:subjectSectionId/students` | Subject identity V; student directory V; avatars F | Cache then viewport |
| `/teacher/grades` | Section/term choices V; submission/visibility records V; counts/controls F | Cache then viewport |
| `/teacher/holistic` | Class/term filters V; student rubric rows V; bounded rating controls F | Cache then viewport |
| `/teacher/holistic/:studentId` | Student identity/free text V; avatar and radar plot F; rubric/history rows V | Cache/viewport; field line cache |
| `/teacher/holistic/domain-trends` | Plot F; labels/student records and descriptions V | Cache then viewport |
| `/teacher/students/:studentId` | Avatar F; identity, address, optional profile fields and academic collections V | Cache/typical lines; cache/viewport rows |
| `/teacher/advisory` | Section identity V; totals F; optional section tabs V; grouped roster V/avatar F | Cache then viewport |
| `/teacher/calendar`, `/parent/calendar` | Calendar geometry F; event lists/text V | Cache then viewport |
| `/parent` | Greeting V; student cards and daily update/event collections V; avatars/date controls F | Cache then viewport |
| `/parent/enrolled-children` | Child collection V; avatar F; identity text V | Cache then viewport |
| `/parent/students/:studentId` | Avatar F; names/address/profile optional fields V; progress/weekly/academic rows V; numeric summaries and plots F | Cache/typical lines; cache/viewport rows |
| `/parent/students/:studentId/topics/:topicId/support` | Topic text and available support choices V; real navigation controls F | Cache/typical lines |
| `/parent/students/:studentId/topics/:topicId/courseware` | Topic description and media collection V; fixed-ratio media F when specified | Cache/viewport; description typical 3 lines |
| `/parent/students/:studentId/topics/:topicId/quiz` | Question, answer text and optional game/level structures V; real controls and fixed artwork F | Cache/typical lines; visible choice count |

## Discovery evidence and verification ledger

`scripts/audit-loading.mjs` enumerates all 55 leaf route patterns from the router
AST (including the inline login adapter). The discovery snapshot also records 170
loading-related source lines across 67 files, including action/saving indicators
and non-loading game animation references that require contextual review. The
snapshot is in the workspace artifacts directory as `qed-loading-discovery.json`.

Implementation and measured contrast/route verification results will be appended
as they are completed. No page is claimed converted or visually verified merely
because it appears in this inventory.

## Initial implementation and measured findings

- Extended the existing SkeletonLoading component into the five primitives. The
  shared LoadingRegion engine and DataLoader fetch adapter use the fixed behavior
  values. Light neutral base is #DDDDDD; dark base is #444444. Shine mixes those
  neutrals toward the existing white surface (40% light / 12% dark). Brand-scoped
  base mixes primary maroon 80% with the white surface; sidebar-scoped base mixes
  dark sidebar maroon 88% with that surface. Real Chromium contrast checks passed
  for page, card, modal, raised, sidebar and brand surfaces in both themes.
- Initially migrated `/teacher` and `/teacher/subjects`; their real layouts are
  reused, rather than copying layout CSS into separate skeleton files. The route
  registry documents each region's classification, reason and count source.
  Cache keys are per-view; the general caches are bounded to 128 entries.
- Short, typical and long names plus differently sized numeric counts were checked
  against the dashboard's fixed tile/plot classifications. Subjects were checked
  with empty, one-item and nine-item results. Static page headings/search/filter
  controls stay real. Column/status labels inside the dashboard's coarse data
  layers still need extraction before complete static-shell fidelity is claimed.
- Reviewed 16 original screenshots and the contact sheet: both initial routes,
  loading/loaded, 375/1280px, light/dark. Corrected a legacy splash obscuring early
  captures and a CSS-layering conflict that overrode the attendance circle radius.
  No table column sizing or layout was changed during this work.

### Confirmed specification conflict: existing automatic table columns

Admin AuditLogs uses native `table-layout: auto`, with no column definitions.
Column widths depend on returned cell contents, independently of row height.
The real `/admin` route was measured in Chromium at 1280px using short and long
valid audit records. Fonts were settled before measurement. Maximum column-width
changes from the pending table were **121.28125px** and **171.171875px** respectively.
Different loaded results also require different column widths from each other.

This conflicts with simultaneously preserving automatic layouts and requiring
skeleton/loaded column x-positions and widths to differ by at most 1px. A first-load
placeholder cannot predict arbitrary future cell widths. The height-based variable
exception does not currently permit this horizontal change.

The user resolved this conflict: preserve automatic layout, mark AUTO-COLUMN,
cache last loaded widths per view, and allow one instantaneous adjustment at swap.
No stable widths are added to loaded tables. Raw initial measurements remain in
`qed-auto-table-width-conflict.json` in the workspace artifacts directory.

## Approved column rule and migration ledger

AUTO-COLUMN is a cause-based classification in addition to variable row height.
Containers carry data-sk-auto-columns and data-sk-variable. Pending colgroups use
cached width shares, else measured real header labels and typical content, else
equal shares. Colgroups are removed at swap so loaded tables retain native layout.
Outgoing bodies fade in a separate absolute table using the same header/column
renderer; they cannot participate in the live table's intrinsic column sizing.
Only opacity and transform animate. The cache is measured after DOM cleanup,
bounded to 128 views, and refreshed on each successful load. Request state is an
explicit calculation dependency for compatibility with React Compiler memoization.

| Table | Classification and reason | Reservation source | Verification |
| --- | --- | --- | --- |
| Admin dashboard audit logs | AUTO-COLUMN: actor names, actions and endpoints alter native column widths; row count and optional metadata alter height | Filter/page key; column cache then header/typical metrics; page size 20 capped to viewport and six rows | Short/long classification; empty/1/9 rows; one swap shift; stable shell; repeat widths <=2px; no geometry animation |
| Admin user directory desktop | AUTO-COLUMN: full names and email lengths alter native columns; returned count alters height | Role/status/search view; column cache then real labels/typical content; row cache then viewport | Real route short/long observed widths; both widths/themes; further repeat/size assertions pending |
| Admin student records desktop | AUTO-COLUMN: measured native widths vary with returned student IDs, names and section labels | Grade/gender/search view; cache then real labels/typical content; row cache then viewport | Both widths/themes captured; short/long classification passed; repeat/size assertions pending |

Newly migrated compositions: Admin dashboard (count leaves, fixed h-52 plot,
variable summary text and audit rows); Admin class directory (variable collection,
existing ClassCard wrappers and leaves); Admin user directory (desktop rows and
mobile wrapping fields); Student Records (desktop grouped rows, mobile fields and
fixed 28px avatars). Titles, filters, headers and always-present actions stay real.
No truncation, fixed loaded column width or new scrolling container was added.
Student context now publishes existing loading/error changes to consumers so error
and retry UI can settle; API calls, mappings and operations are unchanged.

Verification checkpoint: auto-column plus core behavior suite: 27 passed.
Admin dashboard/classes/users real-route suite: 13 passed; Student Records: 4 passed.
These checkpoints do not establish complete route coverage or three final-suite
passes. Remaining routes and unverified field/classification cases stay outstanding.

## Latest route and field checkpoint

- Principal teacher directory: AUTO-COLUMN, observed short/long width variation.
  Per-search/advisory/gender width cache and row reservation; both widths/themes.
- Parent linked-children list: VARIABLE, returned count, optional footer and
  metadata; per-view count cache. Existing scroll container unchanged.
- Academic Year: VARIABLE optional dates/labels and unconfigured notice;
  Terms table AUTO-COLUMN, observed term-name-dependent widths. Native loaded
  layout retained, header and column descriptions shared with skeleton rows.
- Admin Subjects: VARIABLE returned groups and assignments; existing fixed card
  shells retained. Context tracks all parallel grade requests before settlement.
- Principal Teacher Profile: VARIABLE wrapping identity/subtitle, daily schedule
  and section rosters. Existing avatar dimensions and single-line statistics
  remain fixed. Field line counts are remembered after each successful DOM swap.
  Real title, tabs and labels remain visible. Retry available on failed requests.
- Principal Students overview: VARIABLE grade-card count and optional section
  filter. Single-line total count uses its existing control shell. Implementation
  type-checks; real-route screenshots passed both widths/themes.
- Principal Class List (class/grade routes): initial composition uses real
  header, search, gender control and shared StudentDirectoryTable. Existing No.
  column w-12 and single remaining Student column have NOT been modified.
  Non-auto classification still requires short/typical/long observed proof.

Latest full progress suite: 78 passed, route-coverage test failed (45 outstanding
at that checkpoint). Teacher profile/directory/parent suite: 13 passed. Expanded
Principal suite: 17 passed, 8 failed on the new centered-sibling conflict below.
These are progress runs; no final three-pass result is claimed.

### New conflict awaiting user decision: centered fixed control beside variable text

ClassListPage's header uses the existing global style.css rule at line 855:
`:where(div.flex:has(> button.system-back-button)) { align-items: center !important; }`.
The Back button therefore centers against returned grade/section/adviser/room
text. The typical placeholder has more lines than the short loaded fixture.
The real button stays exactly 44 by 44px but shifts at the single swap:
375px viewport y=156.5 -> 138; 1280px viewport y=163.6875 -> 134.6875.
The 8 failing route cases preserve the strict beside-element assertion.
No assertion has been relaxed and no loaded layout has been changed.

This is an existing alignment dependency: a fixed-size control's position depends
on its variable-height sibling. The no-layout-change rule conflicts with the
requirement that everything beside a variable region stay unchanged. Requested
choices: preserve centering and permit one swap-time movement of this control,
or top-align it in both states (a deliberate existing layout change).

## Updated finishing specification audit (2026-10-08)

The 3b65705f attachment supersedes the earlier implementation checklist. Work
continues from the existing engine and route compositions, not from scratch.
New requirements being audited before further migration:
- Keep session-known teacher identity real; current welcome incorrectly waits
  for dashboard statistics and must use auth identity immediately.
- Attendance currently uses a filled disk placeholder for a ring and hides fixed
  status labels inside a coarse data layer. Preserve ring shape, keep fixed
  labels/legend/header real, and load only values/distribution.
- Weekly timetable currently hides client-side weekday/date/time headers inside
  a coarse layer. Extract the real shell and retain shared session rendering.
- All converted routes need stable named region markers and static-content,
  chart-shape, shimmer-phase pixel and overlay verification. Existing screenshot
  presence checks alone are insufficient; existing checks are kept enabled.
- Initial table loads use skeleton rows. Refetches must preserve old nonempty rows
  until 200ms, then dim to 0.6 using opacity only; after two seconds use skeletons.
  Empty previous results use the ordinary initial reservation. Current engine
  immediately skeletonizes refetches and must be corrected.
- Add shine-to-surface contrast >=1.03 and ordering checks on every existing
  surface, including lighter placeholders on dark institutional surfaces.
- Data spinners are removed; action-button and upload indicators are explicitly
  preserved. Current source inventory follows; each entry remains tracked until
  its region is migrated and verified. These are findings, not completion claims.

### Spinner / loading-text inventory at updated audit
```text
src\routes\ProtectedRoute.tsx:9:  if (isLoading) return <div>Loading...</div>;
src\routes\AppRouter.tsx:28:import { QedSplash, QedLoader } from "../shared/components/QedLoader";
src\routes\AppRouter.tsx:88:  if (isLoading) return <QedLoader fill />;
src\routes\AppRouter.tsx:151:      <QedSplash loading={isLoading} />
src\routes\AppRouter.tsx:153:      <Suspense fallback={<QedLoader fill />}>
src\shared\components\QedLoader.tsx:136:export interface QedLoaderProps {
src\shared\components\QedLoader.tsx:146:export function QedLoader({ size = 60, fill = false }: QedLoaderProps) {
src\shared\components\QedLoader.tsx:198:export interface QedSplashProps {
src\shared\components\QedLoader.tsx:210:export function QedSplash({ loading, minDuration = 1200, size }: QedSplashProps) {
src\shared\components\QedLoader.tsx:246:      <QedLoader size={size} />
src\shared\components\QedLoader.tsx:251:export default QedLoader;
src\shared\loading\LoadingRegion.tsx:25:export function LoadingRegion({ as: Tag = "div", loading, error, retry, skeleton, children, label = "Loading…", delay = 200, minDuration = 400, variable = false, className = "", onSettled, layout, layerAs, autoColumns }: ControlledProps) {
src\features\profiles\teacher\pages\attendance\AttendanceCalendarSection.tsx:2:import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
src\features\profiles\teacher\pages\attendance\AttendanceCalendarSection.tsx:354:          <Loader2 size={16} className={`animate-spin ${textMuted}`} />
src\features\profiles\teacher\pages\grades\ParentVisibilitySection.tsx:2:import { Eye, EyeOff, Loader2, CheckSquare, Square } from "lucide-react";
src\features\profiles\teacher\pages\grades\ParentVisibilitySection.tsx:140:            {applying === "show" ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
src\features\profiles\teacher\pages\grades\ParentVisibilitySection.tsx:152:            {applying === "hide" ? <Loader2 size={12} className="animate-spin" /> : <EyeOff size={12} />}
src\features\profiles\teacher\pages\grades\ParentVisibilitySection.tsx:160:          <Loader2 size={18} className={`mx-auto animate-spin ${textMuted}`} />
src\features\profiles\teacher\pages\subjects\SubjectClassListPage.tsx:3:import { ArrowLeft, Download, Loader2, Search, Users } from "lucide-react";
src\features\profiles\teacher\pages\subjects\SubjectClassListPage.tsx:185:            <Loader2 size={15} className={`animate-spin ${textMuted}`} />
src\features\profiles\teacher\pages\attendance\TeacherAttendanceRecordsPage.tsx:3:import { ArrowLeft, Loader2 } from "lucide-react";
src\features\profiles\teacher\pages\attendance\TeacherAttendanceRecordsPage.tsx:87:            <Loader2 size={15} className={`animate-spin ${textMuted}`} />
src\features\profiles\teacher\pages\attendance\TeacherAttendanceRecordsPage.tsx:88:            <p className={`text-xs font-semibold ${textMuted}`}>Loading...</p>
src\features\profiles\teacher\pages\attendance\TeacherAttendancePage.tsx:5:  Loader2,
src\features\profiles\teacher\pages\attendance\TeacherAttendancePage.tsx:246:            <Loader2 size={15} className={`animate-spin ${textMuted}`} />
src\features\profiles\teacher\pages\attendance\TeacherAttendancePage.tsx:407:              <Loader2 size={15} className={`animate-spin ${textMuted}`} />
src\features\profiles\teacher\pages\grades\GradePage.tsx:3:  Download, Send, Loader2, Clock, History,
src\features\profiles\teacher\pages\grades\GradePage.tsx:323:                    <Loader2 size={12} className="animate-spin" /> Checking records…
src\features\profiles\teacher\pages\grades\GradePage.tsx:364:                  {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
src\features\profiles\teacher\pages\grades\GradePage.tsx:483:                  <Loader2 size={18} className={`mx-auto animate-spin ${textMuted}`} />
src\features\profiles\teacher\pages\attendance\AttendanceMonthSummarySection.tsx:2:import { CalendarCheck, CalendarDays, Loader2 } from "lucide-react";
src\features\profiles\teacher\pages\attendance\AttendanceMonthSummarySection.tsx:210:          <Loader2 size={16} className={`animate-spin ${textMuted}`} />
src\features\profiles\teacher\pages\subjects\detail\SubjectRecordsPage.tsx:12:  Loader2,
src\features\profiles\teacher\pages\subjects\detail\SubjectRecordsPage.tsx:411:            <Loader2 size={15} className={`animate-spin ${textMuted}`} />
src\features\profiles\teacher\pages\holistic\StudentHolisticProfilePage.tsx:10:  Loader2,
src\features\profiles\teacher\pages\holistic\StudentHolisticProfilePage.tsx:314:          <Loader2 size={22} className={`animate-spin ${textMuted}`} />
src\features\profiles\teacher\pages\holistic\HolisticOverviewPage.tsx:389:            <p className={`px-4 py-16 text-center text-xs font-medium ${textMuted}`}>Loading...</p>
src\features\profiles\teacher\pages\holistic\HolisticDomainTrendsPage.tsx:414:            <p className={`px-4 py-16 text-center text-xs font-medium ${textMuted}`}>Loading...</p>
src\features\profiles\admin\pages\classes\ClassFormPage.tsx:85:      ? "Loading…"
src\features\profiles\admin\pages\classes\ClassFormPage.tsx:517:                  {loadingGradeLevels ? "Loading…" : "Select grade level…"}
src\features\profiles\admin\pages\classes\ClassFormPage.tsx:546:                      ? "Loading…"
src\features\profiles\admin\pages\classes\ClassFormPage.tsx:647:                            ? "Loading…"
src\features\profiles\admin\pages\studentrecords\StudentFormPage.tsx:434:                {loadingGrades && <option value="">Loading...</option>}
src\features\profiles\admin\pages\studentrecords\StudentFormPage.tsx:472:                {loadingSections && <option value="">Loading...</option>}
src\features\profiles\admin\pages\subjects\AddSubjectPage.tsx:11:  Loader2,
src\features\profiles\admin\pages\subjects\AddSubjectPage.tsx:379:                    ? "Loading…"
src\features\profiles\admin\pages\subjects\AddSubjectPage.tsx:494:                <Loader2 size={26} className="animate-spin text-[#2F6FED]" />
src\features\profiles\admin\pages\subjects\AddSubjectPage.tsx:626:              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
src\features\profiles\admin\pages\studentrecords\components\StudentImportExportToolbar.tsx:8:  Loader2,
src\features\profiles\admin\pages\studentrecords\components\StudentImportExportToolbar.tsx:383:            {isSaving && <Loader2 size={14} className="animate-spin" />}
src\features\profiles\admin\pages\subjects\components\AssignTeacherModal.tsx:2:import { UserPlus, Sparkles, Loader2, AlertCircle } from "lucide-react";
src\features\profiles\admin\pages\subjects\components\AssignTeacherModal.tsx:115:          {saving ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
src\features\profiles\admin\pages\subjects\components\SubjectGradeTemplateSection.tsx:2:import { FileSpreadsheet, Upload, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
src\features\profiles\admin\pages\subjects\components\SubjectGradeTemplateSection.tsx:118:          <Loader2 size={22} className="animate-spin text-[#2F6FED]" />
src\features\profiles\admin\pages\subjects\components\AddSubjectModal.tsx:2:// import { BookOpen, Loader2, Plus, Trash2, Pencil } from "lucide-react";
src\features\profiles\admin\pages\subjects\components\AddSubjectModal.tsx:343://                 ? "Loading…"
src\features\profiles\admin\pages\subjects\components\AddSubjectModal.tsx:531://                                             <Loader2
src\features\profiles\admin\pages\subjects\components\AddSubjectModal.tsx:533://                                               className="animate-spin"
src\features\profiles\admin\pages\subjects\components\AddSubjectModal.tsx:710://             {saving && <Loader2 size={14} className="animate-spin" />}
src\features\profiles\admin\pages\subjects\AdminSubjectDetailPage.tsx:3:import { ArrowLeft, Loader2 } from "lucide-react";
src\features\profiles\admin\pages\subjects\AdminSubjectDetailPage.tsx:75:              <Loader2 size={16} className="animate-spin" />
src\features\profiles\parent\pages\Student\Academic\components\MissedActivities.tsx:2:import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
src\features\profiles\parent\pages\Student\Academic\components\MissedActivities.tsx:78:          <Loader2 size={18} className={`animate-spin ${emptyIcon}`} />
src\features\profiles\admin\pages\subjects\components\EditSubjectModal.tsx:2:import { Pencil, Loader2, AlertCircle, Plus, Trash2 } from "lucide-react";
src\features\profiles\admin\pages\subjects\components\EditSubjectModal.tsx:465:            <Loader2 size={14} className="animate-spin" />
src\features\profiles\admin\pages\subjects\components\EditSubjectModal.tsx:501:          {saving && <Loader2 size={14} className="animate-spin" />}
src\features\profiles\parent\pages\Student\Academic\components\InterventionSupport.tsx:3:import { AlertTriangle, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
src\features\profiles\parent\pages\Student\Academic\components\InterventionSupport.tsx:82:            <Loader2 size={16} className={`shrink-0 animate-spin ${loadingIcon}`} />
src\features\profiles\principal\pages\gradebooks\components\DashboardStatus.tsx:12:      <p className={`text-sm ${textMuted}`}>{error ? error : loading ? "Loading…" : null}</p>
src\features\profiles\parent\pages\Student\Overview\components\HolisticAverage.tsx:130:            Loading…
src\features\profiles\parent\pages\Student\Overview\components\AttendanceOverview.tsx:171:              {monthsLoading && <option>Loading...</option>}
```

## Shared-frame audit and refetch refinement (2026-10-08)

- A pending frame now freezes its reservation for the request, just as an ordinary skeleton layer does. A parent rerender cannot change its line/row reservation between t=0 and reveal.
- Swap animations target only the owning LoadingRegion. Nested field engines own their own transitions and cannot be accidentally selected by a parent.
- Teacher Subjects: real action labels, client-derived school year, and the constant Active label remain readable while fetched subject fields load. Counts are recorded after successful settlement, not during render. Existing cards retain their 218px shell; no new loaded dimensions were introduced.
- Admin Subjects: the existing collection renderer now preserves real card actions during pending data. Both subject collections retain nonempty old rows on refetch using the shared 200ms/2s policy.
- Teacher Profile: real roster labels remain visible during loading. A failed profile request removes its loading content and exposes Retry rather than leaving identity skeletons indefinitely.
- Principal Students: the existing GradeLevelGrid renders both states, preserving static card actions. The collection remains VARIABLE because its count and optional fields come from the response.
- Parent StudentCard: list avatar reservation corrected from 40px to the existing 28px avatar. Status-dot data now receives an avatar primitive; no invented status is shown. The accessible View label remains a string.
- Calendar: today-highlighted rows inherit brand-surface skeleton tokens, while their inset neutral date badges explicitly restore card-surface tokens.
- Named regions/static labels were annotated in 38 migrated files by scripts/tag-loading-regions.mjs. These annotations are measurement hooks, not proof of full route compliance.

Verification checkpoint: loading-frame-audit-typecheck.log is empty (TypeScript passed). loading-frame-audit-tests.log records 56 passed (1.9m), covering existing behavior, Teacher Subjects, Parent routes, Principal Teachers/Profile/Students, and refetch/contrast checks. The eight centered Back-button conflict tests were not part of this targeted run; they remain present and unresolved. This was not a full-app pass.

New design-pixel guards compare actual Chromium screenshots against blank and static-base references, at four paused shimmer phases. A deliberately surface-colored shine is a negative control. Results and any deficiencies are recorded separately; no three-pass/full-route completion claim is made here.

## Additional verified routes and design-test evidence (2026-10-08)

- Landing (/) and Login (/login) are STATIC. Their content and form controls are bundled; login itself is an action and retains its existing Logging in... button feedback. Do not invent skeletons for these routes.
- Admin, Principal, Teacher and Parent /help routes are STATIC. Their role-specific FAQ copy and contact information are local constants. All 24 width/theme route cases for the six static routes passed in loading-static-design-tests.log.
- Teacher /subjects/:subjectSectionId/students: fetched subject/section fields and summaries are VARIABLE (cached wrapping-field lines, typical two). Roster rows are VARIABLE; the native table is AUTO-COLUMN, justified by the short/long fixture measurement in loading-subject-roster-tests.log. Pending columns use cached widths, then the real labels plus typical content. The same column descriptors, group renderer, cell padding, avatar and student-row renderer serve both states. Search, export, column headers and group enum labels render for real. The old Loader2 data spinner and Loading class list... text were removed; retry uses the existing service. Four width/theme cases, classification and empty/one/nine results passed (8 tests).
- Refetch extensions: loading-subject-roster-tests.log also records 3 passing checks for 60ms non-dimming, 2-second fallback with stable surroundings, and prior-empty initial skeleton behavior. External font requests are controlled so font arrival cannot contaminate geometry measurements; no geometric tolerance was loosened.
- Pixel guards now verify >=90% perceptually distinguishable shape area at 0/25/50/75% phases and detect hard interior sweep edges. Static rounded/clip-path antialiasing is excluded from the hard-edge measure because it belongs to the silhouette. Visible area uses the specified 1.03 contrast threshold. Negative controls must fail for their specific visual defect, not an unrelated timeout.
- loading-design-contract-before.log records the new real-route spinner guard rejecting the old full-screen splash. The obsolete QedSplash export and its unused overlay CSS have been removed after confirming there were no remaining source imports. QedLoader still exists for auth/lazy fallback and is not claimed removed.
- Static-content comparisons use direct static text and only elements readable at the tested breakpoint. Fetched descendants of a mixed static paragraph are not accidentally counted as known text; responsive hidden instructions are not required to be readable on the wrong breakpoint.
- Source route registry now has 24 entries out of 55 discovered routes. Registration is not full route verification. Remaining strict overlays, all-route checks, auth/lazy fallback migration and three full passing runs are still outstanding.

Advisory Roster conversion is in progress. Its obsolete separate skeleton invented stat cards and mismatched rows. It has been removed in favor of the existing AdvisoryHeader/AdvisoryTable and shared StudentDirectoryTable states. Shared table bodies can now retain readable enum labels beside hidden primitive leaves using the same timing engine. The first advisory test invocation used an incorrect route path; that was a test authoring error, not a product defect or before-fix proof. Correct-path route/classification checks are being run separately.

## Subsequent route verification checkpoint (2026-10-08)

- Advisory Roster: correct-path checks pass in four viewport/theme combinations. Its native Student column expands by 1040px across valid short/long-name fixtures, so the shared directory is AUTO-COLUMN. The classification check failed before that correction (`loading-student-directory-classification-before.log`). Existing 48px No column is reserved during loading; loaded native columns and overflow are unchanged.
- Principal Gradebooks: shared real gradebook card/group renderer replaces the old separate composition. Static title/filter controls remain real; session/service-cached cards and school year render immediately during revalidation. Group count and wrapping school year are VARIABLE; existing 218px assignment shells are FIXED-SIZE. Six gradebook checks include repeat navigation and inline school-year flow.
- Inline fields: a newly added geometry regression failed with a 21px school-year displacement (`loading-inline-flow-before.log`). Restoring inline-grid for span regions fixes the text flow. The 34 targeted route checks pass (`loading-inline-flow-routes.log`); this excludes the eight unresolved centered Back button checks, which remain enabled in the full suite.
- Teacher Today Attendance: class name and optional closed-term notice are VARIABLE (cached lines, otherwise two/three). The roster is AUTO-COLUMN, confirmed by a long-name fixture; the existing 64px No and 176px Status widths are reserved only while pending, with measured pixel cache preferred for repeat visits. Avatars remain the existing FIXED-SIZE 28px. Date, controls, column/gender labels and legend are STATIC. Shared rows stay reserved across the sequential advisory and attendance requests. Six Chromium checks pass including the original save payload (`loading-teacher-attendance-tests.log`). Action/save spinners remain intact.
- Registry checkpoint: 27 of 55 routes have registered compositions. This is partial coverage, not completion. All-route overlay diffs, complete classification/geometry verification, auth/lazy fallback replacement and three full passing suite runs remain outstanding.

## Parent learning routes and overlay decision (2026-10-08)

- Topic Support Choice has no fetched page data. Quest labels, illustrated background, instructions and navigation targets are known before fetch, so the entire `topic-support-content` is STATIC and needs no invented skeleton. Four width/theme checks pass without primitive shapes; existing quest animations and navigation are preserved.
- Courseware replaces the unrelated rounded placeholder cards, pulse animation and generation-loading message with the actual header/banner/markdown/video renderers. Static study instructions and learning steps now remain real. Fetched titles, markdown structure and optional warnings are VARIABLE; default paragraphs use typical three-line reservations, then cached structure/field lines, capped to viewport. Existing video images keep their FIXED-SIZE aspect-ratio wrappers; video count/title content is VARIABLE. Only the placeholder collection is capped, never the loaded content. Successful resources are cached in memory per view (bounded to 128 views), rendered immediately on repeat mount and revalidated through the same engine. Errors clear placeholders and retry the same service. Video selection/close operations remain intact.
- `loading-courseware-before.log` records the new static-content check failing because the old loading composition omitted “Your learning quest.” The corrected Courseware route/error/empty/short/long checks pass (8 tests). An initial implementation run had incorrect relative imports and two test-fixture issues (ambiguous Close buttons and StrictMode's duplicated initial requests); these are authoring errors, not claimed before-fix evidence. `loading-courseware-static-attendance-tests.log` records 42 passing route checks after those corrections.
- Actual Courseware hero and video-caption surfaces pass contrast and four-phase visible-area/hard-edge checks in both themes (`loading-courseware-pixels.log`, 2 tests). Existing dark caption color is centralized as `--color-courseware-video-surface`; scoped neutral bars are derived from it. These surfaces were already compliant when these tests were added; no fabricated before-fix failure is claimed.
- Screenshot review covered Topic Support mobile light/desktop dark and Courseware mobile light/desktop dark: existing loaded layout remains intact. Review identified excess pending document paragraphs; their viewport reservation was reduced without changing loaded content. Further all-route screenshot review remains required.
- User clarification: apply the 2% outside-loaded-box overlay limit to FIXED-SIZE regions. VARIABLE regions are verified using their agreed stable reservation and allowed one-time resize, so an intentionally three-line skeleton for a one-line result is not rejected by an incompatible fixed-box test.
- Registry checkpoint now 29/55. Production build succeeds (`loading-current-build.log`, 19.59s). A full 196-test checkpoint is in progress; this is not one of the required final three passing runs.

## Full-suite checkpoint and subject templates (2026-10-08)

- `loading-full-checkpoint.log`: 183 passing / 13 failing in 5.4m. Eight failures are the existing centered Back-button conflict; one is the intentionally strict unfinished-route coverage check. Four Admin Dashboard failures exposed inline number reservations adding a 3px descender gap per stat row (12px total on mobile). `span.sk-region` now aligns to the top of the same inherited line box; no fetched width or loaded dimensions were fixed. The 40 targeted Admin/Gradebooks/Subjects checks pass (`loading-inline-baseline-tests.log`). The final whole-suite reruns remain outstanding.
- Admin Subject Details: the shared real SubjectGradeTemplateSection now exposes its own loading leaves. Instructions, upload icon/drop target and real control shells remain visible; only the optional filename, conditional upload/replace label and numeric weight values are placeholders. Current-template presence, intrinsic filename width and wrapping weight summary are VARIABLE. The existing full-width single-line upload control is FIXED-SIZE. Existing filename truncation remains; none was added. Errors clear shapes and offer retry through the existing service. Upload processing spinner is preserved and explicitly marked data-upload-progress.
- The new static-content check failed on the old spinner composition (`loading-subject-template-before.log`). All six route/empty/retry/file-chooser checks pass (`loading-subject-template-tests.log`). Registry checkpoint: 30/55, with complete per-route overlays and verification still outstanding. A follow-up check covers the actual maroon control surface before claiming contrast compliance.

## Class Details verification (2026-10-08)

- The old Class Details route flashed Not Found and hid real title/actions while context data loaded. Shared profile, optional-contact, native schedule and student-directory renderers now reserve fetched leaves and keep static tabs/labels/actions real. Names and optional contacts are VARIABLE (cached lines, otherwise two), avatar and existing truncated stat cells FIXED-SIZE. Schedule and roster are AUTO-COLUMN: both classifications have measured short/long-content width proofs; pending widths use measured cache, then header/typical metrics. Loaded tables retain native automatic widths.
- `loading-class-details-before.log` records the missing known title. `loading-class-error-before.log` catches two identity shapes lingering after an error; unmounting the identity reservation on failure fixes immediate cleanup. `loading-class-time-surface-tests.log` catches dark time-cell contrast 2.0255; the scoped neutral token now passes. All 12 Class Details checks pass in `loading-class-details-verified-tests.log` (26.8s), including four breakpoint/theme screenshots, empty/short/long schedules, retry, native width proofs and actual time-cell pixel checks.
- Subject-template actual control contrast: the light maroon-button surface failed before its scoped override; dark was already compliant (`loading-template-contrast-before.log`). All eight checks pass afterward (`loading-template-contrast-fixed.log`, 20.7s).
- Registry now 31/55. Full-route visual/geometry verification and final whole-suite passing runs remain incomplete.

## User Details and fixed overlay checks (2026-10-09)

- User Details now reserves its existing details layout instead of prematurely showing No User Found. Name, email, contacts and other intrinsic fields remain VARIABLE; cached line counts are preferred, otherwise two for names/email and one for short dates/enums. Role is known from the route, so the role label and account description remain real. Edit/remove controls retain their existing placement and wait for the account data. The teacher role reuses Teacher Profile and waits for the user-to-teacher ID mapping; it never requests the fallback user ID while that mapping is pending. Profile errors use the shared retry path.
- `loading-user-details-before.log` fails because known field labels are absent. All ten route, wrapping-field, error/retry, not-found and teacher ID checks pass (`loading-user-details-verified.log`, 30.9s). The combined Class Details/User Details suite passes 22 checks (`loading-class-user-overlay-tests.log`, 59.0s). Registry checkpoint: 32/55.
- `captureFixedOverlay` produces actual rendered-pixel composites plus JSON measurements under loading-screenshots/diff. It compares fixed fields within their matching loaded boxes, with the strict 2% limit and 1px size check. An origin move caused by an earlier VARIABLE region is recorded separately and normalized for this fixed-field shape comparison; the VARIABLE-region movement assertions remain required. This applies the agreed allowance for content below a variable field to move once, without treating that movement as a fixed-field size change.
- Four Class Details overlays cover the avatar and existing truncated stat cells at both widths/themes. This is partial overlay coverage, not all-route completion. A dedicated negative control extends a real placeholder 64px outside its field and must fail for the outside-pixel ratio. The first harness-only overlay run missed the short request while the browser waited for external fonts; font requests are now aborted as in the other deterministic route fixtures. No behavior delay or acceptance threshold was loosened.
- Reviewed User Details mobile light loaded view and Class Details desktop dark pending view against the current theme: existing white/neutral surfaces, maroon headers, gold sidebar edge and native spacing remain intact.

## Student Details and Holistic Analytics checkpoint (2026-10-09)

- Student Details now keeps the real navigation, personal/guardian labels, Active status and bundled baseline metrics/chart visible. Only fetched identity and schedule values are placeholders. Wrapping identity/optional fields are VARIABLE with cached lines then typical two; short dates/enums use one. The existing 80px initials avatar is FIXED-SIZE. Academic schedule is AUTO-COLUMN, confirmed with valid long subject/teacher data. Same row renderer, native columns, original cell padding and tbody typography are retained; known quarter-grade/status meanings remain real. Errors clear reservations and retry the same student context request. The original not-found state only appears after the student request finishes. Student data mapping, calculations and API endpoints remain unchanged.
- `loading-student-details-before.log` fails on the missing known Back action. All ten Student Details checks plus thirty engine/native-column/refetch regressions pass (`loading-student-engine-regression.log`, 40 tests, 1.3m). Registry now 33/55. The initial implementation had missing prop destructuring in HeroProfileBanner, caught by the application TypeScript project and corrected; this authoring error is not claimed as original-defect evidence. Use `tsc -p tsconfig.app.json --noEmit` or the production build for actual app type checks; root `tsc --noEmit` alone only reads the references solution.
- Holistic Analytics uses the real metric cards and heatmap renderer; domain headings, color-band legend, guidance, tabs and current term/view controls stay real. Metric values/details keep their existing single-line truncation (FIXED-SIZE). Row collection and wrapping labels are VARIABLE; cached per-view row/field counts then viewport/typical two-line labels. Heatmap columns retain the existing explicit 140px + four fractional columns and are not auto-column. Score buttons are disabled only during placeholder rows. Option-request failures now participate in the shared retry/error state instead of becoming unhandled rejections; scoring/interpretation functions are unchanged.
- `loading-holistic-analytics-before.log` catches the absent Development overview frame. Visual inspection then exposed percentage-width metric bars collapsing in an intrinsic inline wrapper; `loading-holistic-metric-width-before.log` fails on those invisible shapes. Giving the loading wrapper its existing field's available width fixes the bars without fixing loaded content widths. Nine route/empty/short/long/focus/retry checks pass (`loading-holistic-analytics-verified.log`, 21.2s). Four metric overlays and actual metric/heatmap contrast and four-phase pixel checks also pass with the overlay contract suite (`loading-holistic-overlay-pixel-tests.log`, 16 tests, 48.3s).
- The existing mobile heatmap clips right-hand domain columns inside its overflow-hidden panel. Asked the user to choose between preserving that layout and recording the limitation, or authorizing horizontal scrolling without fixed height. This is a new conflict between unchanged layout and readable static headers; no layout override has been applied. Its registration/completion is pending that decision. The older centered Back-button decision remains pending separately.
- The corrected fixed-overlay harness suite passes all four size/theme cases and its oversize negative control (`loading-student-overlay-corrected.log`, included in nine passing checks). All-route overlay coverage remains incomplete.

### Subject Performance Analytics continuation — 34/55 registered routes
The report retains its real metric cards, ranking panels, chart axes, filters and priority card while fetched values load. Whole-department bars use the native Recharts plot with shared skeleton primitives; chart width animation is disabled so data swaps do not morph layout. Leading-subject rows, grade rankings and priority lists are VARIABLE because counts and fetched text determine geometry. Row counts use the view cache then viewport capacity; loaded rankings retain their original limits and full-ranking controls. Truncated metric values/details are FIXED-SIZE under the existing layout. Known term and mean labels remain real. The original five-pixel chart radius supplies --sk-chart-radius.
The priority progress track uses its existing translucent-white surface. Its previous placeholder matched that composited background exactly (contrast 1.0); a scoped --sk-base/--sk-shine override now passes actual rendered contrast and four-phase pixel checks in light and dark. See loading-subject-analytics-tests.log (failure), loading-subject-analytics-corrected.log (6 passing), and loading-subject-analytics-final-targeted.log (14 passing, 38.0s). The before-route test failed because the known ranking heading was hidden: loading-subject-analytics-before.log. An initially overbroad cleanup assertion counted Recharts' permanent accessible tooltip status as a loading announcement; it now explicitly preserves that tooltip while requiring zero skeleton layers, primitives and loading status elements. This test-authoring correction is not claimed as a product defect.
Empty, short and long ranking data, retry of all three report requests, fast refetch without dimming, slow refetch retaining old rows at opacity 0.6, metric fixed overlays, actual chart bars and maroon-surface pixel checks pass. Combined report verification: loading-report-routes-verified.log (23 passing). These are targeted results, not completion of the required three passing whole-suite runs. Holistic Analytics remains unregistered pending the existing mobile-clipping layout decision; the centered Back-button layout decision also remains pending.

### Teacher Subject Details — 35/55 registered routes
The separate ad-hoc 1.6-second shimmer, duplicated Back control, skeletonized tabs/legends and invented identity subtitle are removed. The real header, client school year, TabNav, search, legends, actions and grading-table markup now remain present; only fetched title, counts, item headers, students/avatars and score values reserve placeholders. Holistic domain headings, explanations and rating numbers stay real with rating actions disabled until data arrives. The actual score-save payload and saved-item handoff to Full Records pass browser checks. Existing unsaved-change guards, mutations, calculations and loaded truncation are retained. Cached subject data initializes the real first render. A failed records request clears placeholders and offers retry rather than caching partial failed records as a successful load. Template availability still uses the existing safe service and gates Add Item without editing that service.
Classification: title VARIABLE (cached lines then typical two); roster height and item-column count VARIABLE; native grading columns AUTO-COLUMN, proven to vary across short/long names in both assessment and holistic tables. Pending row count uses view cache then viewport; pending item count uses last count then one typical working item. Measured pending column widths are reused per subject/tab, with header/typical text metrics as fallback. Loaded columns retain native automatic sizing. Existing avatars are FIXED-SIZE 28px circles and score controls 56x28px; metadata remains in its existing single-line truncated wrapper. No new fixed loaded widths, truncation or scrolling container was introduced.
Evidence: loading-teacher-subject-before.log fails on the missing real Score Sheet label. loading-teacher-subject-expanded.log has 14 passing route/workflow tests; loading-teacher-subject-pixels.log has 16 passing including actual header, avatar and score-control contrast and four-phase pixels in light/dark. loading-teacher-subject-cache-verified.log proves repeat pending widths within 2px (1 passing). Intermediate repeat-test failures were test setup defects: the navigation target had not committed, an exact heading omitted its subject prefix, and an initial assertion ran before the route mounted. The final test waits for both real route frames and invalidates the actual loaded cache module before initiating the second request. These are not claimed as pre-fix product failures. Production build passed in loading-continuation-build.log (21.12s Vite build). Reviewed mobile light pending/loaded screenshots: original white/neutral cards, maroon controls, table scroll and spacing remain intact; fetched title may resize once under the agreed VARIABLE rules.

### User Account forms — 37/55 registered routes
Add New User Account and Edit User Record share their original form and workflow. The edit route no longer reports Not Found before UsersContext settles; fetched fields seed once per record, preserving subsequent local input. LoadingFormValue keeps each real control shell, styles, options and event handlers and reserves only its unknown single-line value. Route-known role and record ID stay real. New-account values are locally known and never skeletonized. Existing account-creation, generated credentials, edit endpoint/payload, validation and success feedback remain intact. Failed account requests clear shapes and expose retry. The optional active-Principal warning uses the same warning markup and VARIABLE paragraph, cached lines then typical three, with one collapse if absent. Its pending paragraph now fills the existing available flex space after a new visibility test caught zero-width bars; loaded layout is unchanged.
Existing input/select boxes are FIXED-SIZE because text cannot wrap inside these controls and their dimensions come from the original height/grid. Warning presence/text is VARIABLE; locally entered review values are STATIC. Pending native selects include a blank hidden option so browsers cannot display a default Active value underneath the placeholder. Placeholder widths vary by field. Existing save/submit progress behavior is preserved.
Evidence: loading-user-form-before.log fails on the missing real edit heading. loading-user-form-expanded.log: 12 passing workflow/route tests. loading-user-form-warning-before.log: two actual zero-width warning-bar failures. loading-user-form-select-before.log: native select incorrectly showed Active before the blank-option fix. loading-user-form-final-verified.log: 17 passing, 31.8s, including mobile/desktop light/dark screenshots, fixed overlays, strictly equal input field boxes, real warning/input surface contrast and four-phase pixels, retry/not-found, preserved local input and edit payload. Atomic DOM box snapshots avoid independent CDP-node lookup races while retaining exact geometry assertions. loading-forms-build.log: production build passed (15.32s Vite). Reviewed mobile light pending and desktop dark loaded screenshots; original neutral form surfaces and maroon actions remain aligned. A 300-test whole-suite checkpoint is now running; the required three fully passing final runs remain outstanding. Initial checkpoint failures include intermittent Class Details tab clicks after screenshot/overlay capture; their cause is under investigation, not dismissed.

### 2026-10-09 continuation checkpoint and artifact-triggered reload diagnosis
The complete checkpoint ran 300 tests: 288 passed and 12 failed (8.7 minutes), with unedited output in `loading-full-continuation-checkpoint.log`. Eight failures are the previously recorded centered Back-button/content-height conflict; the independent route registry check still reports 18 outstanding routes. Three Class Details tab interactions also failed.
A diagnostic rerun retained the interaction assertions and recorded Vite websocket messages. Writing overlay artifacts generated `{type:"full-reload"}` and restarted the same route between the click and its assertions (`loading-class-websocket-diagnostics.log`). The Tailwind Vite plugin's hotUpdate handler sends this exact payload for a scanned-file change. This is a development-tool artifact, not evidence for changing the Class Details layout or relaxing click assertions. Tailwind source exclusions now omit only generated `loading-screenshots`, `test-results`, and `playwright-report` folders. Application source scanning remains enabled. The first four Class Details breakpoint/theme checks now complete without a full-reload message; full targeted results are recorded separately. No geometry assertion has been removed or loosened.

### Student forms — 39/55 registered routes
`/admin/students/new` and `/admin/students/:studentId/edit` share the existing StudentFormPage wizard and LoadingFormValue leaf renderer. FIXED-SIZE: six native single-line identity inputs/select and two native placement controls, whose loaded dimensions were checked with short and long student names. No truncation or new control dimensions were introduced. VARIABLE: the existing record subtitle can wrap because the external student number is returned data; the database route ID is not substituted. Optional errors and user-entered review fields retain their normal wrapping layout. New-student inputs are known empty/local values and render immediately; selected placement values alone are skeletonized while their choices load. The existing menu options supply the loaded state; no separate option or form layout is copied.
The edit route no longer reports Not Found while StudentsContext is loading, and fetched form values seed once without overwriting edits on retry. Record and placement failures expose the shared alert/retry pattern and clear shapes. Grade/section request retries do not clear a selected section merely because transport failed. Original validation, three-step workflow, endpoint and save payload are retained. The test confirms the PUT payload exactly, including gradeLevel/section string IDs and the external student number. Existing cached records remain visible when context refreshes.
Evidence: `loading-student-form-before.log` fails the original premature Not Found UI. `loading-class-and-student-form-targeted.log`: 16 passed. `loading-student-form-expanded.log`: 27 passed (12 Class Details regressions plus 15 student-form checks), including four breakpoint/theme edit overlays and screenshots, four new-form screenshots, record errors/retry, placement errors/retry without losing edits, empty result, save payload, fixed-control classification, actual input-surface contrast and four-phase pixel checks in both themes. Reviewed mobile light pending and desktop dark loaded screenshots; neutral native form controls, maroon branding, gold sidebar edge and original wizard geometry remain intact. Whole-suite coverage and the broader required per-route assertions are still unfinished.

### Add Subject — 40/55 registered routes
`/admin/subjects/new`: the initial form contains only known empty/local values. The active school year and assessment-category database IDs are fetched prerequisites, not displayed values. Therefore no new skeleton field is invented for them. The shared LoadingRegion tracks their pending/error/settlement accessibly without hiding or dimming real local controls. Native grade control shows its real empty-selection prompt while choices load. FIXED-SIZE: existing native controls, known heading and workflow shell; exact positions and dimensions match before/after load at 375/1280 light/dark. VARIABLE: optional wrapping errors, user-entered review text and parsed file preview. Every prerequisite now has alert/retry; form input state is outside the loader. Existing assessment default-category creation/legacy renaming, template parsing/upload, validation, subject creation endpoint and payload remain intact. Save spinner and template upload/reading spinner are preserved actions; the upload drop zone is explicitly marked data-upload-progress.
Before proof: `loading-add-subject-before.log` fails the old visible Loading active school year text. The first converted run additionally caught a real 21px vertical shift and a visible Loading announcement on a cold direct visit: LoadingRegion depended on primitive imports for its CSS. LoadingRegion now imports its own shared stylesheet, so an all-known form with no primitives still gets visually hidden announcements and correct layer geometry. Strict geometry assertions were retained; the test now explicitly checks the revealed status is 1px and clipped. `loading-form-compositions-verified.log`: all 35 targeted tests pass (8 Add Subject +12 Class Details +15 Student Forms). Four Add Subject pending/loaded screenshots are saved; all fetched values absent from the real form remain absent from its skeleton composition. Overlay shape tests are inapplicable to this route's initial state because it correctly has zero unknown visible data shapes; exact real-field geometry is checked instead.

### Class forms — 42/55 registered routes
`/admin/classes/new` and `/admin/classes/:classId/edit` retain the original creation wizard and editing layout. The original period renderer serves both skeleton and loaded schedule, including the same subject/teacher fields, weekday controls, time fields and Remove action. VARIABLE: returned schedule count (class-specific cache, otherwise viewport reservation at the existing approximately 200px row height); grade/section description (cached line count, otherwise two). The known Updating prefix remains real. FIXED-SIZE: native single-line grade/section/room controls, adviser combobox, existing 132px time controls, subject/teacher controls and weekday buttons. No loaded dimensions, row heights, truncation, scroll containers or table column widths were introduced. New form empty/local values render immediately. Cached selections already represented by their options remain real during choice refresh; UserForm also now preserves existing record values during a context refresh.
Edit no longer returns Not Found while ClassesContext is pending; fetched form data seeds once, preserving dirty fields through retries. Class record, grades, teacher choices, section choices and subject choices each use an accessible retry path. Mutation controls wait for the required record/choices. Existing period mapping, weekday conversion, validation and save endpoints/payloads remain unchanged; exact update payload is checked.
Evidence: `loading-class-form-before.log` catches the premature Not Found state. `loading-class-form-targeted.log`: 19 passing, including 0/1/8 periods, all five request failure/retry cases, mobile/desktop light/dark screenshots, fixed identity overlays, new-form local input preservation, exact update payload and actual input-surface phase pixels. Review of the mobile pending screenshot revealed faint adviser bars: `loading-class-adviser-contrast-before.log` fails light-mode shine contrast at 1.0267 against the required 1.03. The existing disabled button retains its opacity; its skeleton value now sits in the same control frame outside that faded button. Both theme pixel checks pass. `loading-class-form-static-prefix-before.log` catches the missing known Updating prefix, now restored. Bar widths vary between grade/section, subject/teacher and start/end fields. `loading-all-admin-forms-verified.log`: 61 passing across all four admin form suites (1.6m). `loading-class-form-final-verified.log`: 22 passing after the prefix/width refinements. These targeted passes do not substitute for the outstanding final whole-suite runs or full per-route geometry/static/classification coverage. The centered Back-button conflict and mobile Holistic Analytics clipping decision remain pending as recorded above.

### Continuation: Principal Grade Sheet (43/55 registered routes)
- Removed the separate fabricated progress-report skeleton. The original header, search/ranking controls, summary grid and grouped table now supply their own loading leaves through the shared engine. Grade label, School Year prefix, Student/Overall Average headers, gender bands, filters and navigation remain real.
- FIXED-SIZE: three single-line summary values and original 28px avatars. VARIABLE: optional/wrapping section/year fields (cached lines, typical two/one), returned subject count, student groups/rows and intrinsic term selector. AUTO-COLUMN: actual short/long fixtures prove native widths change; cached widths apply only to pending colgroups. Loaded columns remain automatic.
- Native intrinsic term controls need pending-only typical/cached text-width reservation; no loaded min-width or truncation is added. A visual review found the initial term bar had zero width. Both theme tests failed with actual width 0 in loading-grade-sheet-term-before.log; after the fix, measurable width, actual composited contrast and all four shimmer phases pass. The selector is explicitly variable, with tested loaded label-dependent width. Existing right-aligned toolbar neighbors may move once with this intrinsic field, the same content-dependent positioning conflict already recorded; no existing alignment is changed.
- Request failures for term choices, year and grades clear shapes and retry. Server-default term lookup keeps the shell visible. Existing unavailable-term modal and grade calculations remain unchanged. Slow refetch retains/dims rows before the two-second fallback; fast term refetch never dims.
- loading-principal-grade-sheet-expanded.log: 16 passed. loading-grade-sheet-term-after.log: 18 passed. Expanded final run initially used the incorrect attribute value `true` for the established presence-only data-sk-variable marker; this was a test-authoring correction, not a product defect. Existing native-column test also required waiting for actual mounted rows before reading widths; no tolerance was changed.
- Reviewed 375px light skeleton: original mobile toolbar wraps naturally; term value is visible; no added decorative shapes. Production build at the preceding 42-route checkpoint passed (loading-42-routes-build.log).

### Continuation: Domain Trends (44/55 registered routes)
- Removed the data-loading text branch. Original narrative, scorecards, plot and interpreted-result markup now render their own pending leaves through one shared frame. The page title/description/back action, Overall tab, four domain names/icons, /5.0 labels, chart header, axes, legend and chart toggles remain real.
- Region classification: optional advisory/subject collections and their native label widths VARIABLE (cached counts, typical two); original full-width 32px term control FIXED-SIZE; four single-line rubric-score leaves FIXED-SIZE; composite/rubric/delta fields and narratives VARIABLE (line caches then typical three); original h-80 chart FIXED-SIZE within the VARIABLE empty/data body. Date ticks use cached week count then typical three. Four line ribbons use the five existing primitives; no rectangular substitute chart or new card is introduced.
- Errors for advisory sections, terms and trends now clear data placeholders and offer retries. Term changes retain old results and dim at 200ms; the two-second fallback and fast no-dim path both pass. Subject selection, unavailable/no-advisory states and domain toggle behavior are preserved. Existing critical interpretation actions remain below their variable text; their single swap movement follows the previously recorded positioning conflict, with no layout alteration.
- The actual fixed overlay exposed a two-pixel score line-box discrepancy in loading-domain-trends-targeted.log (4 failures, 11 passes). Using a block text primitive inside the existing flex score leaf fixed its metrics; strict 1px and 2% checks are unchanged.
- Initial whole-chart pixel sampling also had to pause the other three overlapping ribbons so reference frames were deterministic (test-authoring correction). After that correction, dark thin curves still showed a genuine 9-level hard edge against tinted bands. A scoped dark chart shine uses 94% base / 6% existing white surface; all shape-pixel checks now pass without changing thresholds or shared timing.
- loading-domain-trends-before.log preserves the old page failing to show the known Weekly Progression shell. loading-domain-trends-expanded.log: 15 passed. loading-domain-trends-verified.log: all 22 passed, including four viewport/theme overlay/screenshots, empty/short/long results, real retries, fast/slow refetch, native subject-tab wrapping and light/dark chart-silhouette pixels. Some requested per-route CLS/classification-negative coverage remains outstanding; these targeted passes are not a claim that every 17–29 assertion is complete.
- Reviewed mobile light pending and desktop dark loaded screenshots. The original long page scrolls in the application main panel; viewport screenshots show the first part of the page, so additional lower-section captures are still needed for a full visual review.

### Continuation: Attendance Records (45/55 registered routes)
- Removed the initial page spinner and the Month/Summary data spinners. The original calendar/table/summary renderers now share pending and loaded leaves. Month/Summary controls, date navigation, weekday/day headers, legends, known roster names, View controls, monthly stat labels and client calendar dates stay real. Unknown section text and term availability use field reservations; pending roster names do not replace names already known from the advisory response.
- The table is deliberately NOT AUTO-COLUMN. Its original 180/28/112/76px colgroup is unchanged; strict 1px column-position/width checks and short/long name/count classification checks pass. The body/optional groups remain VARIABLE. The fixed cell overlays cover a status cell and present/school-days cell without changing their dimensions.
- Monthly four stat value blocks are FIXED-SIZE. Calendar cells are VARIABLE because existing min-height cells can grow with wrapping optional status chips; client dates remain real, fetched clusters reserve cached lines then typical two. Absence rows are VARIABLE, count cache then viewport with original row renderer. Existing Total absent remains below the variable absence list: this is the standing critical-content placement conflict, and no unapproved relocation or sticky behavior is added.
- Optional section/advisory/term widths and notice text are VARIABLE. The native term selector uses pending-only measured/typical width reservation, not a new loaded width. Existing centered header alignment can respond to wrapping section text; this remains the previously recorded positioning conflict.
- Section, term-attendance and history failures now expose alerts/retries and clear shapes. Original attendance cycle, edit permissions, optimistic rollback and POST payload are unchanged and tested. Slow term refetch retains/dims old rows, then falls back after two seconds; fast refetch never dims.
- loading-attendance-records-before.log: both old Month/Summary cases fail because known controls/data-area labels are hidden. loading-attendance-records-targeted.log: 19 passed. loading-attendance-records-expanded.log: 20 passed. The new Month cell overlay initially only wrote the pending capture; its verifier is now invoked after the load (test-authoring correction), and loading-attendance-cells-overlay-verified.log passes all four strict viewport/theme cases.
- Reviewed 375px light Summary and 1280px dark Month pending screenshots. Lower absence-list screenshots are still needed because the app main panel scrolls independently. Original source snapshots for reproducible before checks are preserved outside the project at C:/Users/Mavys/AppData/Local/Temp/qed-attendance-loading-before-20261009.
- Prior checkpoint: loading-44-routes-regression.log contains 135 passing tests; loading-44-routes-build-verified.log contains a successful production build. Initial build identified missing blank metadata fields on pending chart-axis points; adding those non-displayed fields fixed the TypeScript shape without changing loaded chart data.

### Continuation: Holistic Overview (46/55 registered routes)
- Replaced the roster Loading text with the original native table renderer and leaf placeholders. Title, description, search, level labels, Domain Trends action, Assessment Roster, Student/Score/Evaluation/Trend headers and gender group labels remain real. Only fetched people, scores, evaluation/trend labels, selected term and counts are masked.
- AUTO-COLUMN is proven by short/long student and trend-label fixtures. Pending-only colgroups use view-specific measured widths, then header/typical metrics; loaded layout stays native. Repeat Term 1 -> Term 2 -> Term 1 passes the strict 2px cache check. Rows/groups are VARIABLE, cached counts then viewport; original 28px avatars and 28px full-width term control are FIXED-SIZE. Inline count metadata and optional advisory tabs are VARIABLE in width/count. Existing optional tabs can move their neighboring Domain Trends action once; this is the recorded content-dependent alignment conflict, with no layout change.
- Advisory/term/overview failures now clear shapes and retry without losing entered search. Request cancellation prevents stale loads from settling after view changes. Local search/level filtering and primary-trend calculations are unchanged; actual fast/slow term refetch tests pass.
- Added a loaded filter aria-label identical to the original accessible name. The new inline engine initially introduced accessibility-tree spaces inside parentheses; the original exact-name interaction test caught this and the product label was restored, rather than loosening the test.
- loading-holistic-overview-before.log preserves the old page failing to show the known Student header. loading-holistic-overview-targeted.log: 15 passed / 1 accessible-name failure. loading-holistic-overview-expanded.log: all 17 passed, including four viewport/theme avatar overlays/screenshots, native-column classification/cache, empty/short/long rosters, retry/search retention, filters and light/dark actual-surface pixels.
- Reviewed mobile light pending screenshot: original horizontally scrolling roster is retained, no new table widths/truncation or decorative placeholders. Full per-route CLS and all classification-negative assertions remain part of unfinished verification.

## Continuation 47: Student holistic profile
- Replaced the full-card data spinner with the original identity, snapshot, domain cards and subject breakdown renderer using LoadingRegion. Page title/back, Whole-Child Snapshot, All Subjects, domain labels, profile label and Active meaning remain real. Cached student identity is independently available through its own region.
- Identity is VARIABLE (optional metadata); its existing 56px initials block is FIXED-SIZE. Snapshot/interpretations, score-dependent gauge marker, optional sparkline and recommendation regions are VARIABLE. Subject count uses the student/term count cache then two typical cards; paragraphs use cached line count then three lines and the original typography/width. No dimensions or truncation added to loaded content.
- Native subject options contain text only; fetched options remain absent until available, with the known All Subjects option real. Errors for student, terms and profile each have retry. Existing term fallback and subject selection/recommendations remain intact.
- Evidence: loading-holistic-profile-before.log fails on the hidden known snapshot title. loading-holistic-profile-verified.log: 16 passed (45.4s), including 375/1280 light/dark screenshots and fixed initials overlays, empty/1/9 subjects, error retries, empty evaluations, subject selection, gauge/line shapes and actual surface contrast/shimmer pixels. Mobile light screenshot reviewed. Complete route-wide CLS and classification-negative coverage still needs final audit; this is not a full-suite completion claim.

## Continuation 48: Principal dashboard
- Removed the unused DashboardStatus placeholder module and reused all five original section components with optional loading leaves. The date, session welcome, section headings, target, summaries' labels, controls, radar domain labels and axes/grid render immediately. Unknown term/year labels load independently; the school-year error now retries.
- Existing KPI numeric block lines are FIXED-SIZE. Attendance and academic plots retain their original 220/240px sizes; pending chart data uses bar/line/radar shapes inside the existing Recharts plots. Lists, fetched names, optional empty states and rubric paragraphs are VARIABLE. Row/card counts use view caches then three typical cards capped by viewport; descriptions use cached lines then two lines. Rank badges retain their 64px original wrappers and mask only unknown leaves.
- Central sk-surface-brand tokens are reused on the existing maroon hero/KPI. Actual light/dark contrast tests caught and corrected an initially missing scoped token; a shape test caught a zero-width Recharts Customized line and it now uses usePlotArea. Screenshot review caught unmasked ranking zero values; the regression now rejects them.
- Native mobile radar labels clip at the existing card edge; the same preexisting clipping conflict is recorded with Holistic Analytics. No scrolling or dimensions were added. Existing ranking controls remain below the variable top-subject list, the already-recorded critical-neighbor/layout-preservation conflict.
- Evidence: loading-principal-dashboard-before.log fails because the session welcome is hidden. loading-principal-dashboard-final.log: 18 passed (58.2s), including four themes/viewports, fixed KPI overlays, actual contrast/pixels, empty/1/9 grades, separate retries, ranking selection and all plot shapes. Upper and lower screenshots saved; mobile lower holistic screenshot reviewed and led to the ranking leaf correction. Full per-region CLS/classification-negative verification remains part of the final audit.

## Continuation 49: Teacher grades, Parent Visibility and Submission History
- Replaced Checking records and both table data spinners with the existing native table header/row renderers and shared LoadingTable. Static page/tab labels, search/filter controls, Student/Overall Average and visibility headers, actions and gender meanings remain real. Subject column names, scores, fetched identities, optional parent metadata, status and history values use primitives. Grade metadata no longer reports an unfetched zero roster.
- Gradebook and visibility tables are AUTO-COLUMN, proven by separate native-width tests across short/long student and subject data. No loaded widths changed. Pending widths cache by class/term/filter/search; shared LoadingTable accepts a pending-aware header to freeze unknown column layout until swap. Cached subject names remain real. Header placeholders reserve immediately but remain invisible until the shared reveal. Rows use the view count cache then viewport capacity, retaining the original padding and minimum widths.
- Existing 28px avatars are FIXED-SIZE and verified with overlays at four viewport/theme combinations. Class metadata, optional section picker, completeness/status/timestamps, history collection and optional parent contacts are VARIABLE; wrapping class name uses two typical lines. Original actions remain above the table.
- Metadata, gradebook, status, logs and visibility failures each retry. Metadata failure while another tab is active no longer leaves its skeleton indefinitely pending. Local search/filter, CSV, grade submission, visibility selection/update and calculations remain in their original code. Grade submit Loader2 and both visibility action Loader2 indicators are preserved.
- Evidence: loading-teacher-grades-before.log fails on the hidden Student header. loading-teacher-grades-all-tabs.log: 30 passed (1.7m), including all three tabs at 375/1280 light/dark, fixed avatar overlays, native auto-column proofs for both tables, cached widths within 2px, fast/slow refetch, empty/1/9 students, six error sources and valid native markup. Gradebook and visibility mobile light screenshots reviewed; review led to unknown class/count placeholders. A subsequent small change masks the unknown visibility term in its existing subtitle; regression follows. Full per-region CLS/classification-negative/pixel coverage remains for the final audit.

## Verified checkpoint: 49 of 55 routes
- Independent AppRouter AST inventory confirms exactly six still unregistered routes: /principal/students/class/:classId, /principal/students/grade/:gradeId, /principal/holistic-performance-analytics, /teacher/subjects/:subjectId/records, /parent/students/:studentId and /parent/students/:studentId/topics/:topicId/quiz. The first two retain the unresolved centered-control positioning conflict; analytics retains the unresolved existing mobile clipping conflict. The other three still need their remaining shared-layout conversions. Coverage assertions have not been weakened.
- loading-49-routes-regression.log is unedited output: 236 passed (7.1m). This selected regression covers behavior/refetch/overlay contracts, existing forms, grade sheet, domain trends, attendance, holistic overview and the three newly converted routes. It is not the whole suite.
- Two additional real failures are preserved in loading-teacher-grades-final-errors-before.log: a term lookup failure disappeared on Submission History, and gradebook failure retained dependent placeholders/default status. The fix routes the history prerequisite error to its alert/retry and immediately removes unavailable dependent fields across the gradebook error state.
- loading-49-routes-final-pages.log: 52 passed (1.8m) after those final changes, covering all 32 teacher-grade checks, 19 principal dashboard checks and the removed-loader guard. The principal dashboard keeps the existing client-defined intervention count (the service currently returns a constant zero) real before fetch; no calculation/API was changed. Subject/ranking field caches now attach to their real text elements.
- loading-principal-spinner-guard-before.log records the same obsolete-import assertion rejecting the preserved original PrincipalDashboardHome source. The live-source guard passes in the 52-test run and now also prevents the removed generic DashboardSkeleton from returning.
- loading-49-routes-final-typecheck.log records a successful actual app TypeScript check. Production build follows. The required three final whole-suite all-pass runs and complete every-region CLS/classification-negative/static/overlay/pixel checks are still unfinished; no completion claim is made.
- Final checkpoint production build: loading-49-routes-build.log exits 0; Vite built successfully in 19.72s after its TypeScript build. No remaining tool process is running.

## Continuation: accepted variable-aligned rule and remaining principal routes
The latest explicit instruction resolves the previously recorded alignment class. Existing static Back/actions/controls keep their original dimensions, text and alignment. When centered or right-aligned beside variable text, only the position caused by that sibling may change once at swap. The directory test now measures the exact centered-header height delta, preserves strict x/width/height checks and rejects movement while pending. Other directory anchors retain their original full-box assertion. No layout CSS changed.
Class and grade rosters share StudentDirectoryTable (native auto-column) and variable fetched headers/rows. Holistic Performance Analytics retains real domain/legend/control labels, fixed numeric metric blocks, and variable heatmap rows/details. Existing mobile heatmap/radar clipping is preserved and is a reported preexisting limitation, not an excuse to add scrolling or fixed dimensions. Registration is provisional until the current targeted checks finish.

Principal continuation verification: loading-principal-remaining-verification.log is unedited Chromium output: 40 passed (1.4m), including all eight class/grade width/theme cases and all eleven analytics checks. The three principal registrations are now verified (52/55). Remaining three: assessment records, parent student detail, pet quiz.

## Records continuation
The assessment body now reuses the original table/row/cell renderers; cached navigation roster names, avatars, terms and actions remain real. Unknown fresh scores, HPS and configured weights are masked; no fallback grading weights are exposed or used for submission. Failed item/score/rule requests retry. Holistic history uses the original week/domain table and masks only rating values, with independent period/history retries. Existing scroll and min-width classes remain unchanged.
Multi-level headers require native leaf-column measurement: reservations.ts measures a non-spanning data row when available, retaining header fallback for empty tables. A real repeat-load test failed by 14.234375px because fixed-ch score bars enlarged original 56px cells. Percentage widths preserve those native widths and the strict 2px cache check now passes. The long-name width fixture was corrected to include long unbroken name segments, which actually vary min-content widths; ordinary wrapping text alone left the original 240px name column unchanged. This is a fixture correction, not a product defect or a weakened assertion.

Records verification: loading-subject-records-verified.log contains 19 passed (46.5s): assessment and holistic tables in all four width/theme combinations, known cached roster and real headers, actual score-surface contrast/four-phase pixels, error retries, 0/1/9 rows, native width variation and strict <=2px repeat-view cache. Assessment mobile pending screenshot reviewed. The subject records route is now registered (53/55); full per-region overlay/CLS/negative-classification coverage remains unfinished.

New conflict awaiting user decision: Pet Quiz intentionally has ongoing non-loading animations (QedPet breathe/hungry/eat loops, story clouds and LevelSelect highlights). The literal zero-infinite-animations cleanup rule conflicts with preserving game behavior. Asked whether to scope cleanup to loading animations (recommended) or remove game animations too. No gameplay animations removed while awaiting the answer. Quiz data screens are provisionally converted and ten initial targeted checks pass, but no route completion registration until bonus/error/geometry checks and this decision are resolved.


## Pet Quiz animation decision
The user explicitly preserves existing gameplay, story, breathing, hunger and challenge animations. Cleanup assertions require zero remaining **loading** animations, scoped to skeleton primitives and loading layers; game animations remain unchanged. This is an accepted exception to the original blanket infinite-animation wording.


## Parent student detail and Pet Quiz (55 routes registered; final audit pending)
All five parent tabs reuse their real wrappers and leaf renderers. Identity, optional fields, interpretations, activities, concerns, schedule and subject rows are VARIABLE. Existing static controls aligned beside these regions may move once at swap; no loaded dimensions, truncation or scrolling were added. The original attendance ring is 168px, report-average SVG 140px, challenge controls 84px. Report table native columns remain unconstrained after settlement; AUTO-COLUMN safety/cache measurement remains mandatory. Parent report headings, Download PDF and Term filters remain real while loading. Unavailable reports now settle without endless shapes. Gameplay animations are explicitly preserved; loading animation cleanup is scoped accordingly.
Evidence: loading-final-parent-quiz-targeted.log (23 passed, including the parent identity regression), loading-parent-detail-targeted.log (34 passed: five tabs, both widths/themes, empty/one/nine-item wrapping and unavailable report). Screenshot matrix saved under loading-screenshots/parent-detail-* and parent-pet-quiz-*. These targeted results are not the final three full-suite runs.

Parent final verification refinement: native widths are observed to vary for both report tables once the fixture supplies attendance for every released term. The previous fixture populated only T1 while the existing default selected the latest released term T3, accidentally testing an empty table. The unchanged safety assertion caught this. Attendance column cache uses the student/table view (same header definitions across terms), preserving last-known widths while the fetched latest term is unknown. Geometry samplers exclude outgoing duplicate layers and subtract the explicitly permitted 6px transform; width/height and single-swap limits are unchanged.

## Parent profile final visual review and strengthened guards (2026-10-09)
- The known linked-student current class now renders immediately in its original tile; no skeleton masks data already present in the seed.
- Profile avatar is FIXED-SIZE: the original 144px mobile/160px larger circular frame. Unknown gender/image uses SkeletonAvatar in that frame; known identity remains real. Fixed overlays and actual rendered contrast are tested at both widths/themes. No loaded sizing changed.
- The avatar's dark background is affected by the existing global dark-surface rules. A real pixel check caught an 8.35 contrast ratio; the scoped dark token now uses the existing #444444 neutral. Light derives its neutral from the existing border palette. The 1.1–2.0 bound was preserved.
- Progress Report's 140px ring placeholder now uses the actual r=54/stroke=10 silhouette: inner radius 49px (70% of 70px), outer 59px (84.285714%). The viewport and loaded SVG are unchanged.
- `loading-parent-profile-known-before.log`: four new checks fail before these fixes. `loading-parent-profile-known-fixed.log`: all four pass afterward. The expanded 51-case parent run exposed the dark contrast failure (49 passed, 2 failed); the raw log is retained.
- Router coverage now verifies actual lazy-loader connections, so a populated but unused registry cannot pass. The token-color guard also inspects the active primitive, rejecting the legacy pulse/gray classes. Both guards fail against the original sources in `loading-final-guards-before.log` and pass on the current sources in `loading-final-guards.log`.
- `loading-final-new-tests-before.log`: all 89 tests covering the final parent/quiz/records migrations and obsolete-loader guard fail on restored original sources. The restoration script restored current sources afterward. This is individual evidence for that batch, not proof that every older test has been run against original code.
- Exact screenshot matrix audit: 67 route/state groups, each with all 8 skeleton/loaded × 375/1280 × light/dark files; zero missing pairs. Page registration remains 55 routes; extra groups cover tabs and game states.
- A partial full-suite run was intentionally interrupted for these visual fixes, preserved as `loading-pre-final-interrupted.log`, and does not count toward the three required final runs.

## Full-suite finding and final dialog cleanup (2026-10-09)
- The first complete 583-case run finished with 582 passes and one failure; raw output is preserved in loading-full-suite-save-failure.log. It is not counted as an all-pass run.
- The strengthened save test proved that Continue into Review submitted one update before an explicit Save. Distinct React keys for Continue and Save prevent reuse of the activated button as a submit button. The intended review/save workflow, field values, endpoint, payload and loaded layout remain unchanged. loading-student-review-before.log records Expected 0 / Received 1 premature request; the exact payload assertion remains enabled.
- EditSubjectModal's template region is VARIABLE: optional filename/weight-summary text wraps and an absent template changes height. It mounts pending immediately for a valid subject, retains the existing SubjectGradeTemplateSection renderer, removes shapes on error and offers Retry through the same API. Effect cleanup prevents obsolete completions from updating the modal. Save/upload indicators remain.
- New dialog tests exercise a held fetch, failure, shape cleanup and exactly one retry request at 375/1280 in both themes. Fixtures use real catalog names and the actual school-year response shape; the invalid fixture log is retained separately and is not before-fix evidence. Development StrictMode may issue two initial requests, so the assertion verifies exactly one additional retry without altering existing mount behavior.
- loading-final-save-modal-before.log: five tests fail with the original StudentFormPage/EditSubjectModal sources. Current files were restored automatically. loading-final-save-modal-targeted.log: all 19 student-form/dialog cases pass after the fixes.
- The unused routes/ProtectedRoute.tsx and principal gradebooks DashboardStatus.tsx had no imports and were deleted. The obsolete-loader guard prevents those files from returning. Active authentication guards remain in AppRouter; its bootstrap QedLoader decision is still pending.


## Verification evidence checkpoint

All 55 route compositions and their cause-based classifications, count/line/column reservation sources and reasons are listed in loading-screenshots/audit/LOADING-ROUTES.json. The original 170 spinner/discovery matches across 67 files and individual outcomes are retained in LOADING-SPINNERS.json in that directory. Nine action/upload spinner placements are preserved, plus unresolved auth/bootstrap/root Suspense QedLoader call sites. See LOADING-REPORT.md for the three complete suite results and remaining unverified requirements. Classification descriptions do not substitute for unperformed per-region negative tests.
# Follow-up decision audit — 2026-10-10

All 55 route registrations now include their actual renderable composition. The 46 distinct `.loading-view.tsx` layouts are shared by their original lazy controllers and the known-role fallback, rather than copied into placeholder pages. Controller effects and layout/state/handlers were compared with the pre-extraction sources: all 46 preserved, zero issues (`loading-screenshots/audit/LOADING-VIEW-PRESERVATION.json`). The two protected service/config files remain byte-for-byte unchanged.

Role shells stay outside Suspense. A preview explicitly receives outlet context and suppresses data effects, including nested loaders. Both 375px and 1280px tests hold the real lazy dashboard module, observe the actual registered composition without duplicate page requests, then require identical shell/header/sidebar bounds after release. Existing VARIABLE, AUTO-COLUMN, wrapping-field and variable-aligned-static classifications below remain cause-based; no fixed loaded table widths were added.

Auth is a distinct layout-unknown region, not falsely classified as a fixed page skeleton. Its sole allowed brand exception is `QedBootstrapLoader`, with 200ms delay, 400ms minimum, logo opacity only and fully static reduced motion. The entire gate is removed before the protected page mounts, preventing a persistent loading ancestor from changing gameplay/action motion. The obsolete QedLoader was deleted and the guard names the single exception.

The first follow-up full run exposed subject-provider scope: subject fallbacks must be caught inside the existing GradeLevels/Catalog/Sections/SubjectSections providers. SubjectsSection now owns that nested boundary. Add Subject tests explicitly require the real main shell and completed lazy handoff before inspecting the page-data phase; no existing assertion or numerical bound changed. All eight cases then passed twice (16 passed, 46.8s). Failed attempts remain in the raw logs.

All 28 mutation families were rejected when their protected implementation was deliberately broken and passed after source restoration. Exact minimal patches, failure titles, raw logs, hashes and restored summaries are in LOADING-BEFORE-COVERAGE.json. This is the user-approved family proof, not an assertion that all individual cases failed original code. Exhaustive per-region optional-field/overlay/line-cache certification is still distinct from route coverage.


## Role boundary audit — 2026-10-10

All 55 route classifications and data-dependent geometry rules are retained. The registry now records role metadata; concrete compositions are supplied by AdminViews, TeacherViews, PrincipalViews and ParentViews after the corresponding role import. Routes and providers were copied structurally without changing page effects, requests, calculations or loaded chart JSX. Public Landing/Login are static imports.

Chart frames remain FIXED-SIZE for the existing client-known width/height props; axes, labels, domain, margins, data-derived series counts and shape callbacks come from the same JSX. Lightweight preview renderers have no Recharts dependency; the library arrives independently. No new table widths, truncation, loaded fixed dimensions, height animation or brand colors were introduced. Wrapping fields/lists/native columns remain VARIABLE/AUTO-COLUMN according to earlier observations. Shared HelpSupport is audience-aware across roles. TeacherSchedule is an existing shared profile used by both Admin UserView and Principal; it is not exclusive Principal workspace code.

The unchanged fast-auth assertion conflicted with cold code arrival. Explicit user decision: allow ONLY its setup to prepare the fixture role before app mounting; retain all assertions, especially the held-controller zero-request assertion. The separate 1500ms role import test covers delayed opacity-only bootstrap and protected-render gating. No application prefetch before receiving the role, and no page-data prefetch at any time.
