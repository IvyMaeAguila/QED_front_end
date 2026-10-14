// Synthetic read-only fixtures. No real accounts, students or database writes.
export const gradebookSummaries = [
    { gradeLevelId: 1, gradeLevel: 'Grade 1', sections: [
            { sectionId: 11, section: 'Maroon', studentCount: 1, adviserName: 'Synthetic Teacher', isSubmitted: true, gradingPeriodId: 1 },
            { sectionId: 12, section: 'Gold', studentCount: 0, isSubmitted: false, gradingPeriodId: null },
            { sectionId: 13, section: 'Incomplete', studentCount: 1, isSubmitted: true, gradingPeriodId: null },
        ] },
    { gradeLevelId: 2, gradeLevel: 'Grade 2', studentCount: 0 },
];
export const gradebookSheet = { sectionName: 'Maroon', gradeLevel: 'Grade 1', subjects: ['Mathematics', 'Reading', 'Science', 'Arts'].map((subjectName, i) => ({ subjectSectionId: String(i + 1), subjectId: i + 1, subjectName, teacherName: 'Synthetic Teacher', submitted: i === 0, submittedByName: null, submittedAt: null })), students: [{ studentId: 'fixture-1', firstName: 'Synthetic', lastName: 'Fixture', middleName: 'A', gender: 'F', grades: { '1': { status: 'submitted', termGrade: 89.94, average: 10 }, '2': { status: 'pending', termGrade: 100, average: 100 }, '3': { status: 'not_submitted', average: 100, isOwnAdvisory: true }, '4': { status: 'submitted', termGrade: null, average: null } }, overallAverage: null }] };
