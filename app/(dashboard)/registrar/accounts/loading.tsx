import { TableSkeleton } from "@/components/shared/table-skeleton";

export default function AccountsLoading() {
  return (
    <TableSkeleton
      title="Personnel Management"
      description="Loading judiciary directory and security access privileges..."
      columns={5}
      rows={6}
      showFilters={false}
    />
  );
}
