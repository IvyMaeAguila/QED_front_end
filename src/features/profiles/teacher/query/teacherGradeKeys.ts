export const advisoryGradeKey=(year:string,period:string,classId:string|undefined,resource:string)=>['advisory-grades',year,period,classId??'default',resource] as const;
