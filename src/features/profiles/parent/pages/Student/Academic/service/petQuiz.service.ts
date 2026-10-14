import { parentFetch } from '../../../../query/parentRequest';
import type { ApiRequestOptions } from '@shared/http/ApiRequestOptions';
import { API_CONFIG } from '../../../../../../../config/api.config';

const API_BASE_URL = `${API_CONFIG.baseURL}/api/pet`;

export type LevelStatus = "locked" | "available" | "completed";
export type Difficulty = "Easy" | "Medium" | "Hard";

export interface InterventionState {
  levels: { easy: LevelStatus; medium: LevelStatus; hard: LevelStatus };
  bonus: { match: boolean; memory: boolean };
  hungerFilled: number;
  hungerTotal: number;
  interventionCompleted: boolean;
}

export interface QuizQuestion {
  id: number;
  question_text: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  order_index: number;
}

export interface QuizResponse {
  practiceSetId: number;
  title: string;
  difficulty: Difficulty;
  gradeLevel: string | null;
  questions: QuizQuestion[];
}

export interface AnswerSubmission {
  questionId: number;
  selected: "A" | "B" | "C" | "D";
}

export interface GradeSingleResult {
  isCorrect: boolean;
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
}

export interface SubmitResult {
  results: {
    questionId: number;
    selected: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  score: number;
  totalQuestions: number;
  fullyCleared: boolean;
  unlockedNext: Difficulty | null;
  hungerFilled: number;
  hungerTotal: number;
}

export interface BonusGames {
  match: { id: number; left: string; right: string }[];
  memory: { id: number; a: string; b: string }[];
}

// Thrown when the server says this intervention has been archived
// (HTTP 410 Gone). The UI uses it to show the "archived" screen.
// NOTE: 403 is NOT treated as archived, because the backend also uses it for
// "level is locked" and "no access to this student".
export class InterventionArchivedError extends Error {
  constructor() {
    super("This intervention has been archived.");
    this.name = "InterventionArchivedError";
  }
}

function isArchivedStatus(status: number): boolean {
  return status === 410;
}

async function petFetch(url:string,options:ApiRequestOptions|undefined,init:RequestInit) {
 try{return await parentFetch(url,options,init);}catch(error){if(error instanceof Error && 'status'in error && error.status===410)throw new InterventionArchivedError();throw error;}
}

const PetQuizService = {
  async getInterventionState(
    studentId: number | string,
    topicId: number | string,
    options?: ApiRequestOptions
  ): Promise<InterventionState> {
    const res = await petFetch(`${API_BASE_URL}/intervention/${studentId}/${topicId}`, options, {
      credentials: "include",
    });
    if (isArchivedStatus(res.status)) throw new InterventionArchivedError();
    if (!res.ok) throw new Error("Failed to fetch intervention state.");
    return res.json();
  },

  async getQuiz(
    studentId: number | string,
    topicId: number | string,
    difficulty: Difficulty,
    options?: ApiRequestOptions
  ): Promise<QuizResponse> {
    const res = await petFetch(
      `${API_BASE_URL}/quiz/${studentId}/${topicId}?difficulty=${difficulty}`,
      options, { credentials: "include" }
    );
    if (isArchivedStatus(res.status)) throw new InterventionArchivedError();
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Failed to fetch quiz.");
    }
    return res.json();
  },

  async submitAnswer(
    studentId: number | string,
    topicId: number | string,
    practiceSetId: number,
    questionId: number,
    selected: "A" | "B" | "C" | "D",
    options?: ApiRequestOptions
  ): Promise<GradeSingleResult> {
    const res = await petFetch(`${API_BASE_URL}/quiz/${studentId}/${topicId}/grade-single`, options, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ practiceSetId, questionId, selected }),
    });
    if (isArchivedStatus(res.status)) throw new InterventionArchivedError();
    if (!res.ok) throw new Error("Failed to submit single answer.");
    return res.json();
  },

  // mode "full"     = the first pass over all questions (records the score).
  // mode "remedial" = the practice round over missed questions; the server
  //                   verifies every question was answered correctly before
  //                   completing the level and unlocking the next one.
  async submitQuiz(
    studentId: number | string,
    topicId: number | string,
    practiceSetId: number,
    difficulty: Difficulty,
    answers: AnswerSubmission[],
    mode: "full" | "remedial" = "full",
    options?: ApiRequestOptions
  ): Promise<SubmitResult> {
    const res = await petFetch(`${API_BASE_URL}/quiz/${studentId}/${topicId}/submit`, options, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ practiceSetId, difficulty, answers, mode }),
    });
    if (isArchivedStatus(res.status)) throw new InterventionArchivedError();
    if (!res.ok) throw new Error("Failed to submit quiz.");
    return res.json();
  },

  // Saves a finished bonus game (worth 1 segment of the energy meter).
  async completeBonus(
    studentId: number | string,
    topicId: number | string,
    game: "match" | "memory",
    options?: ApiRequestOptions
  ): Promise<{ hungerFilled: number; hungerTotal: number; bonus: { match: boolean; memory: boolean } }> {
    const res = await petFetch(`${API_BASE_URL}/bonus/${studentId}/${topicId}/complete`, options, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ game }),
    });
    if (isArchivedStatus(res.status)) throw new InterventionArchivedError();
    if (!res.ok) throw new Error("Failed to save bonus game progress.");
    return res.json();
  },

  // Bonus games for this topic, written for the student's grade.
  // match  = pairs for the matching game; memory = cards for the memory game.
  async getBonusGames(
    studentId: number | string,
    topicId: number | string,
    options?: ApiRequestOptions
  ): Promise<BonusGames> {
    const res = await petFetch(`${API_BASE_URL}/bonus/${studentId}/${topicId}`, options, {
      credentials: "include",
    });
    if (isArchivedStatus(res.status)) throw new InterventionArchivedError();
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Failed to fetch bonus games.");
    }
    return res.json();
  },

  // Ends the intervention. The server should ARCHIVE it (not hard-delete),
  // so it disappears from the low-grade-topics list and can't be opened again.
  async markTopicMastered(
    studentId: number | string,
    topicId: number | string,
    options?: ApiRequestOptions
  ): Promise<{ success: boolean }> {
    const res = await petFetch(`${API_BASE_URL}/mastery/${studentId}/${topicId}`, options, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Couldn't end the intervention. Please try again.");
    }
    return res.json();
  },
};

export default PetQuizService;