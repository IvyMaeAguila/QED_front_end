/** HTTP status metadata without React or query-cache dependencies. */
export class QueryHttpError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "QueryHttpError";
  }
}
