import { LoadingRegion } from '@shared/loading/LoadingRegion';

export function SessionVerificationError({ retry }: { retry: () => void }) {
  return <main className="grid min-h-dvh place-items-center bg-surface p-6 dark:bg-page-dark">
    <div className="w-full max-w-md rounded-2xl border border-surface bg-white p-6 text-gray-800 shadow-sm dark:border-gray-700 dark:bg-surface-dark dark:text-gray-100">
      <h1 className="mb-3 text-lg font-bold">Session verification unavailable</h1>
      <LoadingRegion name="auth-verification" loading={false}
        error="Unable to verify your session. Your session has not been cleared. Check your connection and retry."
        retry={retry} skeleton={null}>{null}</LoadingRegion>
    </div>
  </main>;
}
