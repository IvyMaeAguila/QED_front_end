// components/Skeleton.jsx
export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-250 ${className}`}
    />
  );
}

// export function StudentInfoTableSkeleton() {
//   return (
//     <div className="flex flex-col gap-2 rounded-lg border p-4 dark:border-gray-700">
//       <Skeleton className="h-4 w-1/3" />
//       <Skeleton className="h-4 w-1/2" />
//       <Skeleton className="h-4 w-1/4" />
//     </div>
//   );
// }