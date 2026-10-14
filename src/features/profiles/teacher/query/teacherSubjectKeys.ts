export const subjectKey=(year:string,subject:string,resource:string,...filters:unknown[])=>['subject',year,subject,resource,...filters] as const;
export function currentSchoolWeek(){
 const now=new Date(),day=now.getDay();now.setDate(now.getDate()+(day===0?-6:1-day));
 return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}
