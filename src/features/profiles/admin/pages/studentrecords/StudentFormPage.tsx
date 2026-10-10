import { useEffect } from "react";
import { StudentFormPageComposition,type StudentFormPageEffectScope } from "./StudentFormPage.loading-view";
export * from "./StudentFormPage.loading-view";

function StudentFormPageDataEffects({ scope }: { scope: StudentFormPageEffectScope }) {
 const { existing, loading, seededRecord, studentId, setForm, setLoadingGrades, setGradeError, fetchGradeLevels, setGradeLevels, isEditing, choicesAttempt, form, setSections, setSectionError, setLoadingSections, fetchSectionByGrade } = scope;
 useEffect(() => {
    if (!existing || loading || seededRecord.current === studentId) return;
    seededRecord.current = studentId;
    setForm({ studentId: existing.studentId, lastName: existing.lastName, firstName: existing.firstName, middleName: existing.middleName ?? "", lrn: existing.lrn, gender: existing.gender, gradeLevel: String(existing.gradeLevelId), section: existing.sectionId != null ? String(existing.sectionId) : "" });
  }, [existing, loading, studentId]);
useEffect(() => {
    let isMounted = true;

    async function loadGrades() {
      setLoadingGrades(true);
      setGradeError(null);
      try {
        const data = await fetchGradeLevels();
        if (isMounted) {
          setGradeLevels(data);
          // 👇 wala nang auto-select dito. Sa "Add" mode, manatiling "Select grade level…"
          // ang naka-display hangga't hindi pa pumipili ang user. Sa "Edit" mode, hindi
          // na ito ginagamit dahil naka-set na agad ang form.gradeLevel mula sa existing student.
        }
      } catch (err) {
        if (isMounted) {
          setGradeError(
            err instanceof Error ? err.message : "Failed to load grade levels",
          );
        }
      } finally {
        if (isMounted) setLoadingGrades(false);
      }
    }

    loadGrades();
    return () => {
      isMounted = false;
    };
  }, [isEditing, choicesAttempt]);
useEffect(() => {
    if (!form.gradeLevel) {
      setSections([]);
      setSectionError(null);
      setLoadingSections(false);
      return;
    }

    let isMounted = true;

    async function loadSections() {
      setLoadingSections(true);
      setSectionError(null);
      try {
        const data = await fetchSectionByGrade(form.gradeLevel);
        if (isMounted) {
          setSections(data);

          if (data.length >= 1) {
            // 👇 kahit isa lang o marami pang section, kailangan pa ring pumili ng user.
            // panatilihin ang existing section kung nasa listahan pa rin (valid pa siya).
            // kung wala talagang naka-assign na section sa student (o hindi na valid),
            // iwanan na lang na blangko para lumabas ang "Select section" placeholder —
            // hindi na dapat mag-auto-select ng section para sa user.
            const stillValid = data.some(
              (s) => String(s.id) === form.section,
            );
            if (!stillValid) {
              setForm((prev) => ({ ...prev, section: "" }));
            }
          } else {
            // 👇 walang section sa grade level na 'to.
            setForm((prev) => ({ ...prev, section: "" }));
          }
        }
      } catch (err) {
        console.error("Failed loading sections:", err);
        if (isMounted) {
          setSectionError(err instanceof Error ? err.message : "Could not load sections.");
        }
      } finally {
        if (isMounted) setLoadingSections(false);
      }
    }

    loadSections();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.gradeLevel, choicesAttempt]);
 return null;
}

export function StudentFormPage() {
 return <StudentFormPageComposition effects={scope => <StudentFormPageDataEffects scope={scope}/>} />;
}
