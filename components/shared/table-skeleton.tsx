import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  title?: string;
  description?: string;
  columns?: number;
  rows?: number;
  showFilters?: boolean;
}

export function TableSkeleton({
  title,
  description,
  columns = 5,
  rows = 6,
  showFilters = true,
}: TableSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          {title ? (
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          ) : (
            <Skeleton className="h-8 w-48" />
          )}
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : (
            <Skeleton className="h-4 w-72" />
          )}
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Filter / Search Bar Skeleton */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-36" />
        </div>
      )}

      {/* Dense Table Skeleton */}
      <div className="rounded border bg-card overflow-hidden">
        <div className="border-b bg-muted/40 p-3 flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={`th-${i}`} className="h-4 flex-1" />
          ))}
        </div>
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={`tr-${r}`} className="p-3.5 flex gap-4 items-center">
              {Array.from({ length: columns }).map((_, c) => (
                <Skeleton
                  key={`td-${r}-${c}`}
                  className="h-4 flex-1"
                  style={{
                    maxWidth: c === 0 ? "120px" : c === columns - 1 ? "100px" : undefined,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}
