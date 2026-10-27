import type {DropoutReader} from './dropoutState';
import {useEffect,type Dispatch,type SetStateAction} from 'react';
import {useTeacherReader} from '../../query/useTeacherReader';
import {getDropoutState} from './services/dropout.service';
export function DropoutEffects({classId,ready,onChange}:{classId:string;ready:boolean;onChange:Dispatch<SetStateAction<DropoutReader>>}){
 const reader=useTeacherReader(['dropouts',classId],o=>getDropoutState(classId,o),'Unable to verify dropout records. Retry before editing attendance.',0,ready);
 const {data,error,retry}=reader;
 const loading=reader.loading&&!data;
 useEffect(()=>onChange({data,loading,error,retry}),[data,loading,error,retry,onChange]);
 return null;
}
