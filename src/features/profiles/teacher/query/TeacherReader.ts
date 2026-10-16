// Lightweight view contract; safe for eager route previews.
export interface TeacherReader<T> {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  offline: boolean;
  retry: () => void;
}
