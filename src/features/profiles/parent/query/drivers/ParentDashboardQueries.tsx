import {memo,useLayoutEffect} from 'react';
import {useParentQueryScope} from '../parentQueryScope';
import {QueryClientProvider} from '@tanstack/react-query';
// src/features/ParentDashboard/context/ParentDashboardContext.tsx
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useParentReader, useParentNavigationRefresh } from "../useParentReader";
import { useParentWriter } from "../useParentWriter";
import { queryClient } from '@shared/query/queryClient';
import { dailyUpdateService } from "../../pages/dashboard/services/dashboard.service";
import {
  verificationService,
  enrolledChildrenService,
} from "../../pages/EnrollledStudent/services/enrolledStudent.service";
import type {
  CardViewMode,
  DailyUpdate,
  LinkStudentInput,
  MatchedStudentRecord,
  Student,
} from "../../pages/dashboard/types/student";
import { useToast } from "@shared/context/ToastContext";

interface ParentDashboardContextValue {
  students: Student[];
  isLoadingStudents: boolean;
  studentsError: string | null;
  refetchStudents: () => Promise<void>;

  dailyUpdates: DailyUpdate[];
  isLoadingDailyUpdates: boolean;
  dailyUpdatesError: string | null;
  refetchDailyUpdates: () => Promise<void>;

  viewMode: CardViewMode;
  setViewMode: (mode: CardViewMode) => void;

  isVerifyModalOpen: boolean;
  pendingMatch: MatchedStudentRecord | null;
  linkError: string | null;
  isVerifying: boolean;
  isConfirming: boolean;
  submitLinkForm: (input: LinkStudentInput) => Promise<void>;
  confirmMatch: () => Promise<void>;
  rejectMatch: () => void;
}

const ParentDashboardContext =
  createContext<ParentDashboardContextValue | null>(null);

function toMatchedStudentRecord(student: Student): MatchedStudentRecord {
  const fullName =
    student.fullName ?? `${student.firstName} ${student.lastName}`.trim();
  const [firstName, ...rest] = fullName.split(" ");

  return {
    id: Number(student.id) || 0,
    idNumber: student.studentNumber,
    firstName: student.firstName ?? firstName ?? "",
    lastName: student.lastName ?? rest.join(" ") ?? "",
    fullName,
    gradeLevel: student.gradeLevel,
    section: student.section,
    adviser: student.adviser,
    gender: student.gender,
  };
}

const EMPTY_STUDENTS:Student[]=[],EMPTY_DAILY:DailyUpdate[]=[];
export interface DashboardSeeds {students?:{data:Student[];updatedAt:number};daily?:{data:DailyUpdate[];updatedAt:number};errors?:{students?:Error;daily?:Error}}
function ParentDashboardProvider({ children,seeds,initialViewMode='grid' }: { children: ReactNode;seeds?:DashboardSeeds;initialViewMode?:CardViewMode }) {
  const [viewMode, setViewMode] = useState<CardViewMode>(initialViewMode);

  const [isVerifyModalOpen, setVerifyModalOpen] = useState(false);
  const [pendingMatch, setPendingMatch] = useState<MatchedStudentRecord | null>(
    null,
  );
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const { showToast } = useToast();

  const studentReader = useParentReader(['children','list'], async options => {
    const response = await enrolledChildrenService.getEnrolledChildren(options);
    if(!response.success) throw new Error(response.message || 'Failed to load linked students.');
    return response.students;
  }, 'Failed to load linked students.',true,seeds?.students,30_000,undefined,{retryOnMount:false,safeRead:true});
  const dailyReader = useParentReader(['dashboard','daily-updates'], async options => {
    const response = await dailyUpdateService.getDailyUpdatesForParent(options);
    if(!response.success) throw new Error(response.message || 'Failed to load daily updates.');
    return response.dailyUpdates;
  }, 'Failed to load daily updates.',true,seeds?.daily,30_000,undefined,{retryOnMount:false,safeRead:true});
  const students = studentReader.data ?? EMPTY_STUDENTS, isLoadingStudents = studentReader.loading, studentsError = studentReader.error;
  const dailyUpdates = dailyReader.data ?? EMPTY_DAILY, isLoadingDailyUpdates = dailyReader.loading, dailyUpdatesError = dailyReader.error;
  const fetchStudents = studentReader.retry, fetchDailyUpdates = dailyReader.retry;
  useParentNavigationRefresh(['children','list'], fetchStudents, /^\/parent(?:\/enrolled-children)?\/?$/);
  useParentNavigationRefresh(['dashboard','daily-updates'], fetchDailyUpdates, /^\/parent\/?$/);
  const verify = useParentWriter(verificationService.verifyStudent, undefined, ['children','verify-link']);
  const confirm = useParentWriter(verificationService.confirmLink, async(response,_variables,key)=>{
    if(response.success) await Promise.all([queryClient.invalidateQueries({queryKey:[...key,'children','list']}),queryClient.invalidateQueries({queryKey:[...key,'dashboard','daily-updates']})]);
  },['children','confirm-link']);

  const submitLinkForm = useCallback(async (input: LinkStudentInput) => {
    setIsVerifying(true);
    setLinkError(null);

    try {
      const response = await verify({
        studentNumber: input.idNumber.trim(),
        lastName: input.lastName.trim(),
        firstName: input.firstName.trim(),
      });

      if (!response.success || !response.student) {
        setLinkError(
          response.message ||
            "No student record matches that ID number. Please check the details and try again.",
        );
        return;
      }

      setPendingMatch(toMatchedStudentRecord(response.student));
      setVerifyModalOpen(true);
    } catch(error) {
      setLinkError(error instanceof Error ? error.message : "Can't connect to server, try again.");
    } finally {
      setIsVerifying(false);
    }
  }, [verify]);

  const confirmMatch = useCallback(async () => {
    if (!pendingMatch) return;

    setIsConfirming(true);
    try {
      const response = await confirm({
        studentNumber: pendingMatch.idNumber,
        lastName: pendingMatch.lastName,
        firstName: pendingMatch.firstName,
      });

      if (!response.success) {
        setVerifyModalOpen(false);
        setPendingMatch(null);
        showToast(response.message || "Student linked failed!", "error");
        return;
      }

      // The authoritative list refresh follows confirmed success.
      setVerifyModalOpen(false);
      setPendingMatch(null);
      showToast("Student linked successfully!", "success");

      // refetch para siguradong tugma sa DB (adviser, section, overallScore,
      // performanceStatus, etc.)
    } catch(error) {
      showToast(error instanceof Error ? error.message : "Student linking failed.", "error");
    } finally {
      setIsConfirming(false);
    }
  }, [pendingMatch, showToast, confirm]);

  const rejectMatch = useCallback(() => {
    setVerifyModalOpen(false);
    setPendingMatch(null);
  }, []);

  const value = useMemo(
    () => ({
      students,
      isLoadingStudents,
      studentsError,
      refetchStudents: fetchStudents,
      dailyUpdates,
      isLoadingDailyUpdates,
      dailyUpdatesError,
      refetchDailyUpdates: fetchDailyUpdates,
      viewMode,
      setViewMode,
      isVerifyModalOpen,
      pendingMatch,
      linkError,
      isVerifying,
      isConfirming,
      submitLinkForm,
      confirmMatch,
      rejectMatch,
    }),
    [
      students,
      isLoadingStudents,
      studentsError,
      fetchStudents,
      dailyUpdates,
      isLoadingDailyUpdates,
      dailyUpdatesError,
      fetchDailyUpdates,
      viewMode,
      isVerifyModalOpen,
      pendingMatch,
      linkError,
      isVerifying,
      isConfirming,
      submitLinkForm,
      confirmMatch,
      rejectMatch,
    ],
  );

  return (
    <ParentDashboardContext.Provider value={value}>
      {children}
    </ParentDashboardContext.Provider>
  );
}

function useParentDashboard() {
  const ctx = useContext(ParentDashboardContext);
  if (!ctx) {
    throw new Error(
      "useParentDashboard must be used within a ParentDashboardProvider",
    );
  }
  return ctx;
}

export type ReaderValue=ReturnType<typeof useParentDashboard>;
function Publish({onChange}:{onChange:(value:ReaderValue)=>void}){const value=useParentDashboard();useLayoutEffect(()=>{onChange(value);},[onChange,value]);return null;}
export default memo(function Queries({onChange,seeds,initialViewMode}:{onChange:(value:ReaderValue)=>void;seeds?:DashboardSeeds;initialViewMode?:CardViewMode}){
 const scope=useParentQueryScope(),[initialized,setInitialized]=useState(false);
 useLayoutEffect(()=>{if(initialized)return;let current=true;for(const [name,error]of Object.entries(seeds?.errors??{})){if(error)queryClient.getQueryCache().build(queryClient,{queryKey:[...scope.key,...(name==='students'?['children','list']:['dashboard','daily-updates'])]}).setState({status:'error',error,data:undefined,fetchStatus:'idle',errorUpdatedAt:Date.now()});}queueMicrotask(()=>{if(current)setInitialized(true);});return()=>{current=false;};},[initialized,seeds,scope.key]);
 return initialized?<QueryClientProvider client={queryClient}><ParentDashboardProvider seeds={seeds} initialViewMode={initialViewMode}><Publish onChange={onChange}/></ParentDashboardProvider></QueryClientProvider>:null;
});
