import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { mockDailyUpdates, mockEvents } from "../data/mockData";
import {
  verificationService,
  enrolledChildrenService,
} from "../../EnrollledStudent/services/enrolledStudent.service";
import type {
  CardViewMode,
  DailyUpdate,
  LinkStudentInput,
  MatchedStudentRecord,
  SchoolEvent,
  Student,
} from "../types/student";
import { useToast } from "@shared/context/ToastContext";

interface ParentDashboardContextValue {
  students: Student[];
  isLoadingStudents: boolean;
  studentsError: string | null;
  refetchStudents: () => Promise<void>;
  dailyUpdates: DailyUpdate[];
  events: SchoolEvent[];
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
  };
}

function toStudentFallback(match: MatchedStudentRecord): Student {
  const [firstName, ...rest] = match.fullName.split(" ");
  return {
    id: `std-${match.idNumber}`,
    studentNumber: match.idNumber,
    firstName: firstName ?? match.fullName,
    lastName: rest.length ? rest.join(" ") : "",
    fullName: match.fullName,
    gradeLevel: match.gradeLevel,
    section: match.section,
    adviser: match.adviser,
    attendanceRate: null,
    attendanceStatus: "pending",
    linked: true,
  };
}

export function ParentDashboardProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<CardViewMode>("grid");

  const [isVerifyModalOpen, setVerifyModalOpen] = useState(false);
  const [pendingMatch, setPendingMatch] = useState<MatchedStudentRecord | null>(
    null,
  );
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const { showToast } = useToast();

  const fetchStudents = useCallback(async () => {
    setIsLoadingStudents(true);
    setStudentsError(null);

    try {
      const response = await enrolledChildrenService.getEnrolledChildren();

      if (!response.success) {
        setStudentsError(response.message || "Failed to load linked students.");
        setStudents([]);
        return;
      }

      setStudents(response.students);
    } catch (error) {
      setStudentsError("Can't connect to server, try again.");
      setStudents([]);
    } finally {
      setIsLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const submitLinkForm = useCallback(async (input: LinkStudentInput) => {
    setIsVerifying(true);
    setLinkError(null);

    try {
      const response = await verificationService.verifyStudent({
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
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const confirmMatch = useCallback(async () => {
    if (!pendingMatch) return;

    setIsConfirming(true);
    try {
      const response = await verificationService.confirmLink({
        studentNumber: pendingMatch.idNumber,
        lastName: pendingMatch.lastName,
        firstName: pendingMatch.firstName,
      });

      if (!response.success) {
        setVerifyModalOpen(false);
        setPendingMatch(null);
        showToast( response.message || "Student linked failed!", "error");
        return;
      }

      const newStudent = response.student ?? toStudentFallback(pendingMatch);

      setStudents((prev) => [...prev, newStudent]);
      setVerifyModalOpen(false);
      setPendingMatch(null);
      showToast("Student linked successfully!", "success");

      // refetch para siguradong tugma sa DB (adviser, section, etc.)
      fetchStudents();
    } finally {
      setIsConfirming(false);
    }
  }, [pendingMatch, fetchStudents, showToast]);

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
      dailyUpdates: mockDailyUpdates,
      events: mockEvents,
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

export function useParentDashboard() {
  const ctx = useContext(ParentDashboardContext);
  if (!ctx) {
    throw new Error(
      "useParentDashboard must be used within a ParentDashboardProvider",
    );
  }
  return ctx;
}