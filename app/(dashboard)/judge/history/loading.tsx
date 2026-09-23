import { TableSkeleton } from "@/components/shared/table-skeleton";

export default function JudgeHistoryLoading() {
  return (
    <TableSkeleton
      title="Judicial Case Archive"
      description="Loading closed legal records and finalized judicial decrees..."
      columns={6}
      rows={8}
      showFilters={true}
    />
  );
}
