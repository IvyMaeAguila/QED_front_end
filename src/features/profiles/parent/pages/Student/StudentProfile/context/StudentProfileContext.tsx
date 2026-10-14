import {createParentContextBridge} from '../../../../query/parentContextBridge';
import type {ReaderValue,ReaderProps} from '../../../../query/drivers/StudentProfileQueries';
export const {Provider:StudentProfileProvider,useValue:useStudentProfile}=createParentContextBridge<ReaderValue,ReaderProps>(()=>import('../../../../query/drivers/StudentProfileQueries'),props=>({profile:props.initialProfile??null,isLoading:true,isSaving:false,error:null,refetch:async()=>{},saveProfile:async()=>{throw new Error('Only an Admin can edit student profile records.');}}));
