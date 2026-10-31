import { useState } from "react";
import { Menu, LayoutDashboard, BookOpen, SquareStar, FileBarChart, UserCircle } from "lucide-react";

type Preview = 'menu' | 'navigation' | 'children' | 'link' | 'verify' | 'student' | 'report-tab' | 'download' | 'profile-tab' | 'edit' | 'save';
type Step = { title: string; description: string; preview: Preview };
const navigation: Step[] = [
  {title: 'Open the menu', description: 'Tap the menu icon at the top left of the screen.', preview: 'menu'},
  {title: 'Open Enrolled Children', description: 'Tap Enrolled Children in the menu to see your linked children.', preview: 'navigation'},
];
const guides: {label: string; title: string; steps: Step[]}[] = [
  {label: 'Link child', title: 'Link your child', steps: [...navigation,
    {title: 'Tap Link Student', description: 'Scroll below your linked children and tap Link Student.', preview: 'children'},
    {title: 'Enter the student details', description: 'Enter the ID Number, First Name, and Last Name exactly as recorded by the school. Tap Connect Student.', preview: 'link'},
    {title: 'Confirm your child', description: 'Check the matched details, then tap Yes, this is correct. Choose Not my child if the details do not match.', preview: 'verify'},
  ]},
  {label: 'Reports', title: 'Download a progress report', steps: [...navigation,
    {title: 'Choose your child', description: 'Tap your child in the linked children list to open their records.', preview: 'student'},
    {title: 'Open Progress Report', description: "Tap the report icon (the fourth tab) above your child's records to open Progress Report.", preview: 'report-tab'},
    {title: 'Review the report', description: 'Choose a term to view the released grades, attendance, and holistic development.', preview: 'download'},
  ]},
  {label: 'Profile', title: 'Update student information', steps: [...navigation,
    {title: 'Choose your child', description: 'Tap your child in the linked children list to open their records.', preview: 'student'},
    {title: 'Open Student Profile', description: "Tap the profile icon (the last tab) above your child's records to open Student Profile.", preview: 'profile-tab'},
    {title: 'Tap Edit', description: 'Tap Edit in the student profile to update the available personal information fields.', preview: 'edit'},
    {title: 'Save your changes', description: 'Review the updated information and tap Save Changes. Use Cancel to leave the original details unchanged.', preview: 'save'},
  ]},
];

/** Decorative phone preview; the instructions and controls outside it are accessible. */
function PhonePreview({stage,darkMode}:{stage:Preview;darkMode:boolean}) {
  const surface=darkMode?'bg-panel-dark text-slate-200':'bg-white text-slate-700';
  const muted=darkMode?'bg-white/10':'bg-slate-100';
  const border=darkMode?'border-border-dark':'border-border-subtle';
  const highlight='ring-2 ring-maroon ring-offset-2 '+(darkMode?'ring-offset-panel-dark':'ring-offset-white');
  const chip='rounded px-2 py-1.5 text-[10px] font-semibold';
  const form=stage==='link'||stage==='save';
  return <div aria-hidden="true" className={'rounded-lg border px-4 py-3 '+border+' '+(darkMode?'bg-white/[0.025]':'bg-brand-light')}>
    <div className={'mx-auto max-w-[260px] overflow-hidden rounded-[18px] border p-1.5 shadow-sm '+border+' '+surface}>
      <div className={'mx-auto mb-2 h-1 w-9 rounded-full '+muted}/>
      <div className={'flex h-8 items-center gap-3 border-b px-2 '+border}>
        <span className={'rounded bg-maroon p-1 text-white '+(stage==='menu'?highlight:'')}><Menu size={13}/></span><span className="text-[11px] font-bold">QED</span><span className={'ml-auto h-5 w-5 rounded-full '+muted}/>
      </div>
      <div className="flex min-h-[130px] flex-col gap-2 p-3">
        {stage==='menu'?<><div className={'mt-1 h-3 w-2/3 rounded '+muted}/><div className={'h-12 rounded '+muted}/><div className={'h-3 w-1/2 rounded '+muted}/></>:stage==='navigation'?<div className="space-y-2 bg-maroon p-3 text-[10px] text-white"><div>Dashboard</div><div className="rounded border border-white/70 bg-white/15 px-2 py-2 font-semibold">Enrolled Children</div><div>Calendar</div></div>:form?<>
          <p className="text-[10px] font-semibold">{stage==='link'?'Student credentials':'Student information'}</p>
          <div className="grid grid-cols-2 gap-1.5">{(stage==='link'?['ID Number','First Name','Last Name']:['Date of birth','Residential address']).map(label=><div key={label} className="text-[8px]">{label}<div className={'mt-1 h-3 rounded border '+border}/></div>)}</div>
          <div className={chip+' mt-auto bg-maroon text-center text-white '+highlight}>{stage==='link'?'Connect Student':'Save Changes'}</div>
        </>:stage==='verify'?<><p className="text-[11px] font-semibold">Verify Student</p><div className={'h-7 rounded '+muted}/><div className={chip+' bg-maroon text-center text-white '+highlight}>Yes, this is correct</div><p className="text-center text-[8px]">Not my child</p></>:stage==='children'||stage==='student'?<>
          <p className="text-[10px] font-semibold">Enrolled Children</p><div className={'flex items-center gap-2 rounded border p-2 '+border+' '+(stage==='student'?highlight:'')}><span className={'h-7 w-7 rounded-full '+muted}/><div className="space-y-1"><div className={'h-2 w-24 rounded '+muted}/><div className={'h-1.5 w-16 rounded '+muted}/></div></div>
          <div className={chip+' mt-auto bg-maroon text-center text-white '+(stage==='children'?highlight:'')}>+ Link Student</div>
        </>:<>
          <div className="flex gap-2 border-b pb-2">{[LayoutDashboard,BookOpen,SquareStar,FileBarChart,UserCircle].map((Icon,index)=>{const active=(stage==='report-tab'||stage==='download')?index===3:index===4;return <span key={index} className={'flex flex-1 justify-center rounded p-1.5 '+(active?'bg-maroon text-white '+(['report-tab','profile-tab'].includes(stage)?highlight:''):muted)}><Icon size={13}/></span>;})}</div>
          {stage==='edit'&&<div className={chip+' ml-auto bg-maroon text-white '+highlight}>Edit</div>}
          <div className={'h-8 rounded '+muted}/><div className={'h-2 w-2/3 rounded '+muted}/>
        </>}
      </div>
    </div>
  </div>;
}

export function MobileParentTutorial({darkMode=false,onClose}:{darkMode?:boolean;onClose?:()=>void}) {
  const [topic,setTopic]=useState(0),[stepIndex,setStepIndex]=useState(0),[hidden,setHidden]=useState(false);
  if(hidden)return null;
  const guide=guides[topic],step=guide.steps[stepIndex],last=stepIndex===guide.steps.length-1;
  const text=darkMode?'text-white':'text-[#111827]',muted=darkMode?'text-[#9CA3AF]':'text-[#6B7280]',border=darkMode?'border-border-dark':'border-border-subtle';
  function dismiss(){setHidden(true);onClose?.();}
  return <section aria-label="Phone tutorial" className={'min-w-0 overflow-hidden rounded-[12px] border shadow-sm '+border+' '+(darkMode?'bg-panel-dark':'bg-white')}>
    <header className={'flex items-center justify-between gap-3 border-b px-4 py-3 '+border}>
      <div><h2 className={'text-sm font-bold '+text}>Quick guide</h2><p className={'mt-0.5 text-xs '+muted}>Using QED on your phone</p></div>
      <button type="button" onClick={dismiss} className={'min-h-11 rounded-lg px-2 text-xs font-semibold '+muted+' hover:bg-maroon/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon'}>Hide guide</button>
    </header>
    <div className="space-y-4 p-4">
      <div role="group" aria-label="Tutorial topics" className={'qed-segmented-control flex rounded-lg p-1 '+(darkMode?'bg-white/5':'bg-brand-light')}>
        {guides.map((item,index)=><button key={item.label} type="button" aria-pressed={topic===index} onClick={()=>{setTopic(index);setStepIndex(0);}} className={'min-h-11 min-w-0 flex-1 whitespace-nowrap rounded-lg px-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon '+(topic===index?'bg-maroon text-white shadow-sm':muted)}>{item.label}</button>)}
      </div>
      <div className="flex items-center justify-between gap-3"><h3 className={'text-sm font-semibold '+text}>{guide.title}</h3><span className={'shrink-0 text-xs tabular-nums '+muted}>Step {stepIndex+1} of {guide.steps.length}</span></div>
      <PhonePreview stage={step.preview} darkMode={darkMode}/>
      <div aria-live="polite" aria-atomic="true" className="min-h-[96px]">
        <h4 className={'text-sm font-semibold '+text}>{step.title}</h4><p className={'mt-1.5 text-sm leading-relaxed '+muted}>{step.description}</p>
      </div>
      <div className={'flex items-center justify-between gap-3 border-t pt-4 '+border}>
        <button type="button" disabled={stepIndex===0} onClick={()=>setStepIndex(i=>i-1)} className={'min-h-11 rounded-lg border px-4 text-xs font-semibold transition-colors disabled:opacity-40 '+border+' '+text}>Back</button>
        <button type="button" onClick={()=>last?dismiss():setStepIndex(i=>i+1)} className="min-h-11 rounded-lg bg-maroon px-5 text-xs font-semibold text-white transition-colors hover:bg-maroon-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon focus-visible:ring-offset-2">{last?'Done':'Next'}</button>
      </div>
    </div>
  </section>;
}
