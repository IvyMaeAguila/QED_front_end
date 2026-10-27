import {boundedFetch} from '@shared/http/boundedFetch';
import {QueryHttpError} from '@shared/http/QueryHttpError';
import {API_CONFIG} from '../../../../../../config/api.config';
import type {TeacherRequestOptions} from '../../../query/teacherQueryScope';
export type Dropout={studentName?:string;declaredByName?:string;declaredAt?:string|null;id:string;studentId:string;lastAttended:string|null;effectiveDate:string;reason:string;remarks:string};
export type TransferIn={studentId:string;studentName:string;joinedDate:string};
export type DropoutState={transferIns?:TransferIn[];classId:string;schoolYearId:string;today:string;asOf:string|null;students:Record<string,{lastAttended:string|null;risk:{count:number;since:string|null}}>;dropouts:Dropout[]};
export type Declaration={effectiveDate:string;reason:string;remarks:string};
export const DROPOUT_REASONS=['Prolonged absence','Personal or family circumstances','Health concerns','Financial difficulties','Other'];
async function request(path:string,options:TeacherRequestOptions,body?:unknown){
 const response=await boundedFetch(API_CONFIG.baseURL+'/api/teacherAttendance/'+path,{method:body?'POST':'GET',credentials:'include',signal:options.signal,headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 if(response.status===401)options.onUnauthorized?.();
 const result=await response.json();if(!response.ok)throw new QueryHttpError(result.message||'Unable to update dropout records.',response.status);
 return result;
}
export async function getDropoutState(classId:string,options:TeacherRequestOptions={}):Promise<DropoutState>{
 const result=await request(encodeURIComponent(classId)+'/dropouts',options);
 if(!result.data||!Array.isArray(result.data.dropouts)||!result.data.students)throw new Error('Dropout records could not be verified. Refresh attendance.');
 return result.data;
}
export async function declareDropout(classId:string,studentId:string,data:Declaration,options:TeacherRequestOptions){await request(encodeURIComponent(classId)+'/students/'+encodeURIComponent(studentId)+'/dropout',options,data);}
export async function reverseDropout(classId:string,studentId:string,declarationId:string,reason:string,options:TeacherRequestOptions){await request(encodeURIComponent(classId)+'/students/'+encodeURIComponent(studentId)+'/dropout/reverse',options,{declarationId,reason});}
