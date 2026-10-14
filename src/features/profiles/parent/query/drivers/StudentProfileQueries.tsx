import {memo,useLayoutEffect} from 'react';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
// context/StudentProfileContext.tsx
// Location: Student/StudentProfile/context/StudentProfileContext.tsx

import { createContext, useContext } from "react";
import { useParentChildReader } from "../useParentChildReader";
import type { ReactNode } from "react";
import type { StudentProfileData } from "../../pages/Student/StudentProfile/types/types";
import {
  fetchStudentProfile,
  type UpdateStudentProfilePayload,
} from "../../pages/Student/StudentProfile/service/StudentProfile.service";

interface StudentProfileContextValue {
  profile: StudentProfileData | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  saveProfile: (updates: UpdateStudentProfilePayload) => Promise<void>;
}

const StudentProfileContext = createContext<StudentProfileContextValue | undefined>(undefined);

interface StudentProfileProviderProps {
  studentId: string;
  /** Optimistic seed (e.g. from mapDetailStudentToProfile) shown while the real fetch resolves. */
  initialProfile?: StudentProfileData;
  children: ReactNode;
}

function StudentProfileProvider({ studentId, initialProfile, children }: StudentProfileProviderProps) {
  const reader=useParentChildReader(['profile'],studentId,options=>fetchStudentProfile(studentId,options),'Failed to load student profile.',300_000);
  const value:StudentProfileContextValue={profile:reader.denied?null:reader.data??(reader.loading?initialProfile??null:null),isLoading:reader.loading,isSaving:false,error:reader.error,refetch:reader.retry,saveProfile:async()=>{throw new Error('Only an Admin can edit student profile records.');}};

  return <StudentProfileContext.Provider value={value}>{children}</StudentProfileContext.Provider>;
}

function useStudentProfile(): StudentProfileContextValue {
  const ctx = useContext(StudentProfileContext);
  if (!ctx) {
    throw new Error("useStudentProfile must be used within a StudentProfileProvider");
  }
  return ctx;
}

export type ReaderValue=ReturnType<typeof useStudentProfile>;
export type ReaderProps=Omit<Parameters<typeof StudentProfileProvider>[0],'children'>;
function Publish({onChange}:{onChange:(value:ReaderValue)=>void}){const value=useStudentProfile();useLayoutEffect(()=>{onChange(value);},[onChange,value]);return null;}
export default memo(function Queries({onChange,...props}:ReaderProps&{onChange:(value:ReaderValue)=>void}){return <QueryClientProvider client={queryClient}><StudentProfileProvider {...props}><Publish onChange={onChange}/></StudentProfileProvider></QueryClientProvider>;});
