import { TableSkeleton } from "@/components/shared/table-skeleton";

export default function AuditLoading() {
  return (
    <TableSkeleton
      title="System Audit Log"
      description="Loading immutable judicial audit ledger records..."
      columns={6}
      rows={10}
      showFilters={true}
    />
  );
}
