import { TableSkeleton } from "@/components/shared/table-skeleton";

export default function LawyerBillingLoading() {
  return (
    <TableSkeleton
      title="Fee Statements & Incurred Charges"
      description="Loading statutory document inspection ledger and payment balances..."
      columns={5}
      rows={6}
      showFilters={false}
    />
  );
}
