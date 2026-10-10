import { useEffect } from "react";
import { TeacherAttendancePageComposition,type TeacherAttendancePageEffectScope } from "./TeacherAttendancePage.loading-view";
export * from "./TeacherAttendancePage.loading-view";

function TeacherAttendancePageDataEffects({ scope }: { scope: TeacherAttendancePageEffectScope }) {
 const { section, setAttendanceLoading, setAttendanceError, fetchAdvisoryAttendance, setAttendance, setAttendanceLoadedFor, attendanceAttempt } = scope;
 useEffect(() => {
    if (!section) {
      setAttendanceLoading(false);
      return;
    }

    let cancelled = false;
    setAttendanceLoading(true);
    setAttendanceError(null);

    fetchAdvisoryAttendance(section.classId)
      .then((att) => {
        if (cancelled) return;
        setAttendance(att.data);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load advisory attendance:", err);
        setAttendanceError(
          "Couldn't load attendance for this class. Please try again.",
        );
      })
      .finally(() => {
        if (!cancelled) { setAttendanceLoading(false); setAttendanceLoadedFor(section.classId); }
      });

    return () => {
      cancelled = true;
    };
  }, [section?.classId, attendanceAttempt]);
 return null;
}

export function TeacherAttendancePage() {
 return <TeacherAttendancePageComposition effects={scope => <TeacherAttendancePageDataEffects scope={scope}/>} />;
}
