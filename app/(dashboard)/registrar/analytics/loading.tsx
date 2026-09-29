import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-72 rounded-sm" />
          <Skeleton className="h-3 w-96 rounded-sm" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28 rounded-sm" />
          <Skeleton className="h-8 w-28 rounded-sm" />
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="border border-border rounded-sm bg-card p-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-20 w-full rounded-sm" />
        <Skeleton className="h-20 w-full rounded-sm" />
        <Skeleton className="h-20 w-full rounded-sm" />
        <Skeleton className="h-20 w-full rounded-sm" />
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-72 w-full rounded-sm" />
          <Skeleton className="h-64 w-full rounded-sm" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-sm" />
          <Skeleton className="h-72 w-full rounded-sm" />
        </div>
      </div>
    </div>
  );
}
