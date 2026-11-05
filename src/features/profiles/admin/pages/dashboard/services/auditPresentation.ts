import type {AuditLogEntry} from './auditLogs.service';
export function auditPresentation(entry: Pick<AuditLogEntry,'endpoint'|'action'|'resource'|'statusCode'>) {
 const path=entry.endpoint.split('?')[0].toLowerCase();
 const action=path==='/api/auth/logout'?'LOGOUT':entry.action.toUpperCase();
 const areas:Record<string,string>={auth:'Account access',teacherattendance:'Attendance',teachergrading:'Grades'};
 const first=path.split('/').filter(Boolean)[1]??'';
 const area=areas[first]??entry.resource;
 const verbs:Record<string,[string,string]>={LOGIN:['Logged in','log in'],LOGOUT:['Logged out','log out'],CREATE:[first==='user'?'Added a user':'Added a record',first==='user'?'add a user':'add a record'],UPDATE:['Updated a record','update a record'],DELETE:['Removed a record','remove a record'],UPLOAD:['Uploaded a file','upload a file'],SUBMIT:['Submitted records','submit records'],CHANGE:['Updated records','update records']};
 const verb=verbs[action]??verbs.CHANGE;
 const successful=entry.statusCode>=200&&entry.statusCode<400;
 const result=successful?'Successful':entry.statusCode===409?'Conflict':entry.statusCode===403?'Not permitted':entry.statusCode>=500?'Service unavailable':'Not completed';
 return {action:successful?verb[0]:'Attempted to '+verb[1],area,result,successful};
}
