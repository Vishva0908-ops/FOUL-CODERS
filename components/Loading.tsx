"use client";

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-dark-border border-t-accent-blue"></div>
    </div>
  );
}

export function QuestionSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-dark-border bg-dark-surface p-4">
      <div className="h-4 w-3/4 rounded bg-dark-border"></div>
      <div className="mt-2 h-3 w-1/4 rounded bg-dark-border"></div>
    </div>
  );
}

export function RoomSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-dark-border bg-dark-surface p-6">
      <div className="h-6 w-1/3 rounded bg-dark-border"></div>
      <div className="mt-3 h-4 w-2/3 rounded bg-dark-border"></div>
    </div>
  );
}
