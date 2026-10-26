import { boundedFetch as fetch } from '@shared/http/boundedFetch';
import { API_CONFIG } from '../../../../../../config/api.config';
import type {ApiRequestOptions} from '@shared/http/ApiRequestOptions';
import {QueryHttpError} from '@shared/http/QueryHttpError';

const BASE_URL = `${API_CONFIG.baseURL}/api/gradeLevel`;

export interface DBGradeLevelResponse {
  id: number; 
  grade_level: string; 
}

export const fetchGradeLevels = async (options:ApiRequestOptions={}): Promise<DBGradeLevelResponse[]> => {
  try {
    const response = await fetch(`${BASE_URL}/getGradeLevels`, {credentials: "include",signal:options.signal});
    if(response.status===401)options.onUnauthorized?.();
    
    if (!response.ok) {
      throw new QueryHttpError(`Failed to fetch grade levels: ${response.statusText}`,response.status, undefined, {requestId: response.requestId});
    }
    
    const rawData: DBGradeLevelResponse[] = await response.json();
    return rawData;
  } catch (error) {
    if(!options.signal?.aborted)console.error("Error in gradeService:", error);
    throw error;
  }
};

export interface DBSectionResponse {
  id: number;
  section_name: string;
  grade_level: string
}

export const fetchSectionByGrade = async (gradeLevelId: string | number,options:ApiRequestOptions={}): Promise<DBSectionResponse[]> => {
  try {
    // Ginawang gradeLevelId ang variable para tugma sa query parameter ng backend natin
    const response = await fetch(`${BASE_URL}/getSectionByGrade?gradeLevelId=${encodeURIComponent(gradeLevelId)}`, {credentials: "include",signal:options.signal});
    if(response.status===401)options.onUnauthorized?.();
    
    if (!response.ok) {
      throw new QueryHttpError(`Failed to fetch sections: ${response.statusText}`,response.status, undefined, {requestId: response.requestId});
    }
    
    return await response.json();
  } catch (error) {
    if(!options.signal?.aborted)console.error("Error in sectionService:", error);
    throw error;
  }
};
