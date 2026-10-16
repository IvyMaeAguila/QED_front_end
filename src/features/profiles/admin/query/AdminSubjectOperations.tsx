import {createContext,useContext} from 'react';
import * as subjects from '../pages/subjects/services/subject.service';
import * as templates from '../pages/subjects/services/subjectGradeTemplate.service';
import {fetchAllSchoolYears} from '../pages/subjects/services/academicyear.service';
import type {GradeLevelsContextValue} from '../pages/subjects/context/gradeLevelsContext';
import type {SectionsContextValue} from '../pages/subjects/context/SectionsContext';
import type {SubjectsCatalogContextValue} from '../pages/subjects/context/SubjectsCatalogContext';
import type {SubjectSectionsContextValue} from '../pages/subjects/context/SubjectSectionsContext';
export interface AdminSubjectOperations {
 addSubject:typeof subjects.addSubject;updateSubjectAssignment:typeof subjects.updateSubjectAssignment;
 assignTeacher:typeof subjects.assignTeacherToSubject;toggleStatus:typeof subjects.toggleSubjectStatus;
 uploadTemplate:typeof templates.uploadGradeTemplate;fetchTemplate:typeof templates.getActiveGradeTemplate;
 fetchYears:typeof fetchAllSchoolYears;
}
// Existing isolated component fixtures retain their standalone service contract.
const legacy:AdminSubjectOperations={addSubject:subjects.addSubject,updateSubjectAssignment:subjects.updateSubjectAssignment,assignTeacher:subjects.assignTeacherToSubject,toggleStatus:subjects.toggleSubjectStatus,uploadTemplate:templates.uploadGradeTemplate,fetchTemplate:templates.getActiveGradeTemplate,fetchYears:fetchAllSchoolYears};
export const AdminSubjectOperationsContext=createContext<AdminSubjectOperations>(legacy);
export const useAdminSubjectOperations=()=>useContext(AdminSubjectOperationsContext);
export interface AdminSubjectsBridge {grades:GradeLevelsContextValue;sections:SectionsContextValue;catalog:SubjectsCatalogContextValue;assignments:SubjectSectionsContextValue;operations:AdminSubjectOperations;}
const noop=async()=>{},notReady=async()=>{throw new Error('Subject data is not ready.');};
export const pendingSubjects:AdminSubjectsBridge={
 grades:{gradeLevels:[],loading:true,error:null,refetch:noop},
 sections:{sections:[],loading:false,sectionIdsUsedByClasses:new Set(),getSectionsForGrade:()=>[],loadSectionsForGrade:noop,loadSectionIdsUsedByClasses:noop,addSection:notReady,editSection:notReady,removeSection:notReady},
 catalog:{loading:true,assessmentError:null,assessmentTypes:[],getSubjectNamesForGrade:()=>[],loadSubjectsForGrade:noop,loadAssessmentTypes:noop,addAssessmentType:notReady,editAssessmentType:notReady,removeAssessmentType:notReady},
 assignments:{subjects:[],loading:true,error:null,getSubjectsForGrade:()=>[],loadSubjectsForGrade:noop,addLocalSubject:()=>{},updateLocalSubject:()=>{}},
 operations:{addSubject:notReady,updateSubjectAssignment:notReady,assignTeacher:notReady,toggleStatus:notReady,uploadTemplate:notReady,fetchTemplate:notReady,fetchYears:notReady},
};
