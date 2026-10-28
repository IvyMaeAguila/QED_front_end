import type {DropoutState} from './services/dropout.service';
export type DropoutReader={data?:DropoutState;loading:boolean;error:string|null;retry:()=>void};
export const initialDropoutReader:DropoutReader={loading:true,error:null,retry:()=>{}};
export function effectiveDropout(reader:DropoutReader,studentId:string){return reader.data?.dropouts.find(d=>d.studentId===studentId);}
