import { parentFetch } from '../../../../query/parentRequest';
import type { ApiRequestOptions } from '@shared/http/ApiRequestOptions';
import { API_CONFIG } from '../../../../../../../config/api.config';

import type { ScheduleItem, ScheduleDay } from "../types/types";

interface RawScheduleItem {
  id: string;
  subject: string;
  teacher: string;
  startTime: string;
  endTime: string;
  days: ScheduleDay[];
}

const BASE_URL = `${API_CONFIG.baseURL}/api/classSchedule`;

export async function fetchClassSchedule(studentId:string,options?:ApiRequestOptions):Promise<ScheduleItem[]> {
 const response=await parentFetch(`${BASE_URL}/${studentId}`,options);const data:RawScheduleItem[]=await response.json();
 return data.map(row=>({id:row.id,subject:row.subject,teacher:row.teacher,startTime:row.startTime,endTime:row.endTime,days:row.days}));
}
