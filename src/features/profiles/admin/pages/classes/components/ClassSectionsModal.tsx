import { useEffect } from "react";
import { SubjectsSection } from "../../subjects/SubjectSection";
import { ManageSectionsModal } from "../../subjects/components/ManageSectionsModal";
import { useSubjectSections } from "../../subjects/context/SubjectSectionsContext";
import { GRADE_LEVELS, type GradeLevel, type SubjectsTheme } from "../../subjects/types/types";

type Props = { defaultGrade: GradeLevel; theme: SubjectsTheme; onClose: () => void };

function SectionManager({ defaultGrade, theme, onClose }: Props) {
  const { subjects, loadSubjectsForGrade } = useSubjectSections();
  useEffect(() => {
    for (const grade of GRADE_LEVELS) void loadSubjectsForGrade(grade);
  }, [loadSubjectsForGrade]);
  return <ManageSectionsModal defaultGrade={defaultGrade} subjects={subjects} {...theme} onClose={onClose} />;
}

export function ClassSectionsModal(props: Props) {
  return <SubjectsSection><SectionManager {...props} /></SubjectsSection>;
}
