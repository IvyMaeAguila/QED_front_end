import {AccountSelect} from '@shared/components/AccountSelect';
import {useState} from 'react';
import {useRouteEffect as useEffect} from '@shared/loading/RoutePreview';
import {Pencil,Loader2,AlertCircle} from 'lucide-react';
import {useTeachers} from '../../classes/context/TeachersContext';
import {formatTeacherName} from '../../classes/types/Teacher';
import {ACCENT,GRADE_LEVELS,type Subject,type SubjectsTheme} from '../types/types';
import {useSections} from '../context/SectionsContext';
import {ModalShell} from './ModalShell';
import type {SchoolYearRow} from '../services/academicyear.service';
import {useAdminSubjectOperations} from '../../../query/AdminSubjectOperations';
interface EditSubjectModalProps extends SubjectsTheme {
  subject: Subject;
  onClose: () => void;
  onSave: (updates: Partial<Subject>) => void | Promise<void>;
  saving?: boolean;
  error?: string | null;
}

export function EditSubjectModal({subject,onClose,onSave,saving:parentSaving=false,error=null,...theme}:EditSubjectModalProps){
 const {fetchYears:fetchAllSchoolYears}=useAdminSubjectOperations();
 const {teachers}=useTeachers();const {getSectionsForGrade,loadSectionsForGrade}=useSections();
 const [name,setName]=useState(subject.name),[gradeLevel,setGradeLevel]=useState(subject.gradeLevel),[schoolYear,setSchoolYear]=useState(subject.schoolYear),[teacherId,setTeacherId]=useState(subject.teacherId??''),[section,setSection]=useState(subject.section??'');
 const [localSaving,setLocalSaving]=useState(false),[saveTemplateError,setSaveTemplateError]=useState<string|null>(null);
 const saving=parentSaving||localSaving;const {darkMode,textMuted}=theme;
 const [schoolYears,setSchoolYears]=useState<SchoolYearRow[]>([]);
 useEffect(()=>{void loadSectionsForGrade(gradeLevel);},[gradeLevel,loadSectionsForGrade]);
 useEffect(()=>{let active=true;void fetchAllSchoolYears().then(rows=>{if(active)setSchoolYears(rows);}).catch(error=>console.error('Failed to load school years:',error));return()=>{active=false;};},[fetchAllSchoolYears]);
 const gradeSections=getSectionsForGrade(gradeLevel);
 const sectionOptions=section&&!gradeSections.some(s=>s.name===section)?[{id:'current',name:section},...gradeSections]:gradeSections;
 function handleClose(){if(!saving)onClose();}
 async function handleSave(){
  if(saving||!name.trim()||!section.trim()||!schoolYear)return;
  setLocalSaving(true);setSaveTemplateError(null);
  try{await onSave({name:name.trim(),gradeLevel,schoolYear,teacherId:teacherId||null,section,status:subject.status});}
  catch(error){setSaveTemplateError(error instanceof Error?error.message:'Could not save changes.');}
  finally{setLocalSaving(false);}
 }
  const inputClasses = `w-full h-10 px-3 rounded-lg border text-sm font-semibold outline-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white focus:border-maroon-light"
      : "bg-brand-light border-border-subtle text-[#111827] focus:border-maroon-light"
  }`;
  const disabledInputClasses = `${inputClasses} opacity-60 cursor-not-allowed`;
  const labelClasses = `block text-xs font-bold uppercase tracking-wide mb-1.5 ${textMuted}`;

  return (
    <ModalShell
      title="Edit Subject"
      icon={Pencil}
      onClose={handleClose}
      closeDisabled={saving}
      size="xl"
      {...theme}
    >
      <p className={`text-xs font-medium leading-relaxed lg:col-span-2 ${textMuted}`}>
        Editing renames the existing curriculum entry — this does not create a
        new subject.
      </p>

      {(error || saveTemplateError) && (
        <div
          className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold lg:col-span-2 ${
            darkMode
              ? "border-[#7F1D1D] bg-[#7F1D1D]/20 text-[#F87171]"
              : "border-[#FEE2E2] bg-[#FEF2F2] text-[#B91C1C]"
          }`}
        >
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{saveTemplateError || error}</span>
        </div>
      )}

      <div className="space-y-5">
      <div className="space-y-4">
      <div>
        <label className={labelClasses}>Subject Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} disabled={saving} className={saving ? disabledInputClasses : inputClasses} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClasses}>Grade Level</label>
          <AccountSelect data-account-select="" value={gradeLevel} onChange={(e) => {
            const nextGrade = e.target.value as Subject["gradeLevel"];
            setGradeLevel(nextGrade);
            if (nextGrade !== gradeLevel) setSection("");
          }} disabled={saving} className={saving ? disabledInputClasses : inputClasses}>
            {GRADE_LEVELS.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
          </AccountSelect>
        </div>
        <div>
          <label className={labelClasses}>Section</label>
          <AccountSelect data-account-select=""
            value={section}
            onChange={(e) => setSection(e.target.value)}
            disabled={saving}
            className={saving ? disabledInputClasses : inputClasses}
          >
            <option value="">Select section…</option>
            {sectionOptions.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </AccountSelect>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClasses}>Assigned Teacher</label>
          <AccountSelect data-account-select=""
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            disabled={saving}
            className={saving ? disabledInputClasses : inputClasses}
          >
            <option value="">Not Assigned</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {formatTeacherName(t)}
              </option>
            ))}
          </AccountSelect>
        </div>
        <div>
          <label className={labelClasses}>School Year</label>
          <AccountSelect data-account-select="" value={schoolYear} onChange={(e) => setSchoolYear(e.target.value)} disabled={saving} className={saving ? disabledInputClasses : inputClasses}>
            {[...new Set([subject.schoolYear, ...schoolYears.map((year) => year.school_year)])].filter(Boolean).map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </AccountSelect>
        </div>
      </div>

      </div>
      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end sm:gap-3 sm:pt-2 lg:col-span-2">
        <button
          onClick={handleClose}
          disabled={saving}
          className={`h-10 w-full rounded-lg border px-5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${
            darkMode
              ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
              : "border-border-subtle text-[#374151] hover:bg-brand-light"
          }`}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !name.trim() || !section.trim() || !schoolYear}
          className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-5 text-xs font-bold text-white transition-opacity sm:w-auto ${
            saving || !name.trim() || !section.trim() || !schoolYear
              ? "opacity-50 cursor-not-allowed"
              : "hover:opacity-90"
          }`}
          style={{ background: ACCENT }}
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
      </div>
    </ModalShell>
  );
}
