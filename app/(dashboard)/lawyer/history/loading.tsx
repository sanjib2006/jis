import { TableSkeleton } from "@/components/shared/table-skeleton";

export default function LawyerHistoryLoading() {
  return (
    <TableSkeleton
      title="Case Law Repository"
      description="Loading closed legal records available for statutory inspection..."
      columns={6}
      rows={8}
      showFilters={true}
    />
  );
}
