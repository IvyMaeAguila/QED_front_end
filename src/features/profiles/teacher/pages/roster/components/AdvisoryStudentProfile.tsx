import AdvisoryProfileProgress from './AdvisoryProfileProgress';
import { User, Phone, LayoutGrid, Venus, Mars, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { AdminThemeContext } from '../../../../admin/pages/AdminLayout';
import type { Student } from '../../../../admin/pages/studentrecords/types/Students';
import { StudentAvatar } from '@shared/components/StudentAvatar';
import { Skeleton, SkeletonText } from '@shared/components/SkeletonLoading';
import { LoadingRegion } from '@shared/loading/LoadingRegion';

type ProfileStudent = Student & { guardianName?: string; guardianContact?: string; guardianEmail?: string; dateOfBirth?: string; address?: string };
type Props = {
 student: ProfileStudent; fullName: string; theme: AdminThemeContext; loading: boolean; navigation: ReactNode;
 subjects: { id: string; subject: string; teacher: string }[]; subjectsLoading: boolean; subjectsError: string | null; retrySubjects: () => void;
};

export default function AdvisoryStudentProfile({student,fullName,theme,loading,navigation,subjects,subjectsLoading,subjectsError,retrySubjects}:Props) {
 const {darkMode,panelBg,panelBorder,textPrimary,textMuted}=theme;
 const card='min-w-0 overflow-hidden '+panelBg;
 const surface='overflow-hidden rounded-[var(--radius-table)] border shadow-card '+panelBg+' '+panelBorder;
 const gradeSection=[student.gradeLevel,student.section].filter(Boolean).join(' - ');
 const accent='var(--brand-ink)';
 const value=(text:string|undefined,width='14ch')=>loading?<SkeletonText width={width} className="inline-block max-w-full align-middle" />:text;
 const uniqueSubjects=Array.from(new Map(subjects.map(row=>[JSON.stringify([row.subject.trim().toLowerCase(),row.teacher]),row])).values());
 function infoRow(Icon:LucideIcon,label:string,text:string,muted=false) {
  return <div key={label} className={'flex items-start gap-3 border-t py-3 first:border-t-0 xl:border-t-0 xl:py-2 '+panelBorder}>
   <Icon size={16} strokeWidth={1.75} className="mt-1 shrink-0" style={{color:accent}} aria-hidden="true" />
   <div className="min-w-0"><dt className={'text-xs '+textMuted}>{label}</dt><dd className={'mt-0.5 break-words text-xs font-medium leading-relaxed '+(muted?textMuted:textPrimary)}>{value(text)}</dd></div>
  </div>;
 }
 return <div className="w-full min-w-0 min-h-full space-y-6 pb-12" data-advisory-student-profile="">
  {navigation}
  <div className={surface} data-profile-surface="">
  <section className={card+' border-b p-5 '+panelBorder} aria-label="Student summary">
   <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
    <div className="flex min-w-0 items-center gap-4">
     <div className={'flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full '+(darkMode?'bg-white/10 text-slate-400':'bg-slate-100 text-slate-400')}>
      {loading?<Skeleton className="h-full w-full rounded-full" />:<StudentAvatar gender={student.gender} name={fullName} className="h-14 w-14" />}
     </div>
     <div className="min-w-0">
      <p className={'text-xs '+textMuted}>Student</p>
      <h2 className={'mt-1 break-words text-xl font-bold leading-tight '+textPrimary}>{value(fullName,'20ch')}</h2>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
       <span className={'rounded-full border px-2 py-0.5 text-xs font-medium '+panelBorder+' '+textMuted}>{value([student.gradeLevel,student.section?'Section '+student.section:''].filter(Boolean).join(' · '),'18ch')}</span>
       <span className={'rounded-full border px-2 py-0.5 text-xs font-medium '+panelBorder+' '+textMuted}>{value(student.gender,'6ch')}</span>
      </div>
     </div>
    </div>
    <dl className={'grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-2 border-t pt-4 text-xs lg:w-72 lg:shrink-0 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0 '+panelBorder}>
     {([['Student ID',student.studentId],['Grade and section',gradeSection],['Student LRN',student.lrn]] as const).map(([label,text])=><div key={label} className="contents"><dt className={textMuted}>{label}</dt><dd className={'break-words font-medium '+textPrimary}>{value(text||'Not specified','12ch')}</dd></div>)}
    </dl>
   </div>
  </section>
  <AdvisoryProfileProgress key={student.id} student={student} theme={theme} ready={!loading && student.dbId>0} information={<div className="grid min-w-0 items-stretch md:grid-cols-2">
    <section className={card+' px-5 py-4'} aria-label="Student information">
     <h2 className={'border-b pb-3 text-sm font-bold '+panelBorder+' '+textPrimary}>Student information</h2>
     <dl className="xl:grid xl:grid-cols-3 xl:gap-x-4 xl:pt-3">{infoRow(User,'Full name',fullName)}{infoRow(student.gender==='Female'?Venus:Mars,'Gender',student.gender)}{infoRow(LayoutGrid,'Grade and section',gradeSection)}
      {student.dateOfBirth&&infoRow(User,'Date of birth',student.dateOfBirth)}
      {student.address&&infoRow(LayoutGrid,'Address',student.address)}
     </dl>
    </section>
    <section className={card+' border-t px-5 py-4 md:border-l md:border-t-0 '+panelBorder} aria-label="Guardian">
     <h2 className={'border-b pb-3 text-sm font-bold '+panelBorder+' '+textPrimary}>Guardian</h2>
     <dl className="xl:grid xl:grid-cols-2 xl:gap-x-4 xl:pt-3">{infoRow(User,'Name',student.guardianName||'Not specified',!student.guardianName)}{infoRow(Phone,'Number',student.guardianContact||'No phone on file',!student.guardianContact)}
      {student.guardianEmail&&infoRow(User,'Email',student.guardianEmail)}
     </dl>
    </section>
   </div>} />
  <section className={card+' border-t '+panelBorder} aria-label="Subjects and teachers">
   <div className={'border-b px-5 py-4 '+panelBorder}><h2 className={'text-sm font-bold '+textPrimary}>Subjects and teachers</h2></div>
   <LoadingRegion loading={subjectsLoading} error={subjectsError} retry={retrySubjects} name="advisory-profile-subjects" skeleton={null} frame={pending=><div className="overflow-x-auto"><table className="w-full table-fixed text-left text-xs">
    <colgroup><col className="w-3/5" /><col className="w-2/5" /></colgroup>
    <thead className={darkMode?'bg-white/[0.03]':'bg-brand-light'}><tr><th scope="col" className={'px-5 py-3 font-bold uppercase tracking-wide '+textMuted}>Subject</th><th scope="col" className={'px-4 py-2.5 font-medium '+textMuted}>Teacher</th></tr></thead>
    <tbody>{(pending?Array.from({length:3},(_,i)=>({id:String(i),subject:'',teacher:''})):uniqueSubjects).map(row=><tr key={row.id} data-sk-region="student-performance-row" className={'border-t '+panelBorder}><td className={'break-words px-5 py-3 font-medium leading-relaxed '+textPrimary}>{pending?<SkeletonText width="20ch" className="max-w-full" />:row.subject}</td><td className={'break-words px-5 py-3 leading-relaxed '+textMuted}>{pending?<SkeletonText width="16ch" className="max-w-full" />:row.teacher}</td></tr>)}
     {!pending&&!uniqueSubjects.length&&<tr><td colSpan={2} className={'px-4 py-7 text-center '+textMuted}>No subjects assigned or scheduled for {gradeSection}.</td></tr>}
    </tbody>
   </table></div>}>{null}</LoadingRegion>
  </section>
  </div>
 </div>;
}

