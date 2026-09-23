import { TableSkeleton } from "@/components/shared/table-skeleton";

export default function HearingsLoading() {
  return (
    <TableSkeleton
      title="Courtroom Hearings"
      description="Loading scheduled hearings and courtroom session allocations..."
      columns={6}
      rows={6}
      showFilters={true}
    />
  );
}
