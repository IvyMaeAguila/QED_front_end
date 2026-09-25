import { twMerge } from "tailwind-merge";

export function Skeleton({ className = "" }) {
  return (
    <div
      className={twMerge("animate-pulse rounded-md bg-gray-200 dark:bg-gray-250", className)}
    />
  );
}

