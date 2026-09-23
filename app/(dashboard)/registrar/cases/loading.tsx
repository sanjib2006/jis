import { TableSkeleton } from "@/components/shared/table-skeleton";

export default function CasesLoading() {
  return (
    <TableSkeleton
      title="Case Repository"
      description="Loading judiciary dockets and active legal proceedings..."
      columns={6}
      rows={8}
      showFilters={true}
    />
  );
}
