import { useEffect } from "react";
import { ClassFormPageComposition,type ClassFormPageEffectScope } from "./ClassFormPage.loading-view";
export * from "./ClassFormPage.loading-view";

function ClassFormPageDataEffects({ scope }: { scope: ClassFormPageEffectScope }) {
 const { existing, classesLoading, seededRecord, classId, setSubjectsResolved, setForm, setLoadingGradeLevels, fetchGradeLevels, setGradeLevels, setChoiceError, choiceAttempt, setLoadingAllTeachers, fetchAllTeachers, setAllTeachers, form, setSections, setLoadingSections, fetchSectionsByGrade, setSubjects, setLoadingSubjects, fetchSubjectsByGrade, isEditing, subjectsResolved, subjects } = scope;
 useEffect(() => {
    if (!existing || classesLoading || seededRecord.current === classId) return;
    seededRecord.current = classId;
    setSubjectsResolved(false);
    setForm({ gradeLevelId: existing.gradeLevelId, section: existing.section ?? "", room: existing.room ?? "", subjectName: "", adviserId: existing.adviserId, schedule: existing.schedule });
  }, [existing, classesLoading, classId]);
useEffect(() => {
    let active = true;
    setLoadingGradeLevels(true);
    fetchGradeLevels()
      .then((data) => {
        if (active) setGradeLevels(data);
      })
      .catch((err) => {
        console.error(err);
        if (active) setChoiceError("Failed to load grade levels.");
      })
      .finally(() => {
        if (active) setLoadingGradeLevels(false);
      });
    return () => {
      active = false;
    };
  }, [choiceAttempt]);
useEffect(() => {
    let active = true;
    setLoadingAllTeachers(true);
    fetchAllTeachers()
      .then((data) => {
        if (active) setAllTeachers(data);
      })
      .catch((err) => {
        console.error(err);
        if (active) setChoiceError("Failed to load teachers.");
      })
      .finally(() => {
        if (active) setLoadingAllTeachers(false);
      });
    return () => {
      active = false;
    };
  }, [choiceAttempt]);
useEffect(() => {
    if (form.gradeLevelId === "") {
      setSections([]);
      return;
    }
    let active = true;
    setLoadingSections(true);
    fetchSectionsByGrade(form.gradeLevelId, existing?.id)
      .then((data) => {
        if (active) setSections(data);
      })
      .catch((err) => {
        console.error(err);
        if (active) setChoiceError("Failed to load sections.");
      })
      .finally(() => {
        if (active) setLoadingSections(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.gradeLevelId, choiceAttempt]);
useEffect(() => {
    if (form.gradeLevelId === "") {
      setSubjects([]);
      return;
    }
    let active = true;
    setLoadingSubjects(true);
    fetchSubjectsByGrade(form.gradeLevelId)
      .then((data) => {
        if (active) setSubjects(data);
      })
      .catch((err) => {
        console.error(err);
        if (active) setChoiceError("Failed to load subjects.");
      })
      .finally(() => {
        if (active) setLoadingSubjects(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.gradeLevelId, choiceAttempt]);
useEffect(() => {
    if (!isEditing || subjectsResolved) return;
    if (subjects.length === 0) return;

    setForm((f) => ({
      ...f,
      schedule: f.schedule.map((p) => {
        const match = subjects.find((s) => s.subject_name === p.subject);
        return match ? { ...p, subject: String(match.id) } : p;
      }),
    }));
    setSubjectsResolved(true);
  }, [subjects, isEditing, subjectsResolved]);
 return null;
}

export function ClassFormPage() {
 return <ClassFormPageComposition effects={scope => <ClassFormPageDataEffects scope={scope}/>} />;
}
