/** HTTP status metadata without React or query-cache dependencies. */
export class QueryHttpError extends Error {
  readonly status: number;
  readonly outcome?: 'uncertain' | 'conflict' | 'not_saved';
  readonly code?: string;
  readonly requestId?: string;
  constructor(message: string, status: number, outcome?: 'uncertain' | 'conflict' | 'not_saved', details?: {code?:string;requestId?:string}) {
    super(message);
    this.status = status;
    this.outcome = outcome;
    this.code = details?.code;
    this.requestId = details?.requestId;
    this.name = "QueryHttpError";
  }
}
