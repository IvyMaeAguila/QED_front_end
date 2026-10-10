import { useEffect } from "react";
import { type TeacherClassRoster } from "./components/TeacherClassRosters";
import { TeacherSchedulePageComposition,type TeacherSchedulePageEffectScope,type TeacherSchedulePageRouteProps } from "./TeacherSchedulePage.loading-view";
export * from "./TeacherSchedulePage.loading-view";

function TeacherSchedulePageDataEffects({ scope }: { scope: TeacherSchedulePageEffectScope }) {
 const { teacher, setClassRosters, setRostersLoading, setRostersError, getClassList, rosterAttempt } = scope;
 useEffect(() => {
    let active = true;
    const classes = new Map<number, { gradeSection: string | null; room: string | null }>();
    for (const advisoryClass of teacher?.advisories ?? []) {
      const classId = Number(advisoryClass.classId);
      if (Number.isInteger(classId) && classId > 0 && !classes.has(classId)) {
        classes.set(classId, {
          gradeSection: `${advisoryClass.gradeLevel ?? ""} · ${advisoryClass.section ?? ""}`,
          room: advisoryClass.room,
        });
      }
    }

    if (!teacher || classes.size === 0) {
      setClassRosters([]);
      setRostersLoading(false);
      setRostersError(false);
      return () => { active = false; };
    }

    setRostersLoading(true);
    setRostersError(false);
    Promise.all(
      [...classes.entries()].map(async ([classId, scheduledClass]) => {
        try {
          const classList = await getClassList(classId);
          if (!classList) return { roster: null, failed: true };
          const sectionLabel = `${classList.grade} · ${classList.sectionInfo.section}`;
          return {
            failed: false,
            roster: {
              classId,
              sectionLabel: sectionLabel.trim() || scheduledClass.gradeSection || "Section not assigned",
              room: scheduledClass.room || classList.sectionInfo.room,
              students: classList.roster,
            } satisfies TeacherClassRoster,
          };
        } catch (error) {
          console.error(`Failed to load class roster ${classId}:`, error);
          return { roster: null, failed: true };
        }
      }),
    ).then((results) => {
      if (!active) return;
      setClassRosters(results.flatMap((result) => result.roster ? [result.roster] : []));
      setRostersError(results.some((result) => result.failed));
    }).finally(() => {
      if (active) setRostersLoading(false);
    });

    return () => { active = false; };
  }, [teacher?.teacherId, teacher?.schedule, teacher?.advisories, rosterAttempt]);
 return null;
}

export function TeacherSchedulePage(props: TeacherSchedulePageRouteProps = {}) {
 return <TeacherSchedulePageComposition {...props} effects={scope => <TeacherSchedulePageDataEffects scope={scope}/>} />;
}
