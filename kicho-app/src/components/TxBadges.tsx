import { DEPOSIT_LABEL, type DepositStatus, type TxType } from "@/lib/types";

export function TypeBadge({ type }: { type: TxType }) {
  return type === "sales" ? (
    <span className="inline-block rounded-md bg-sales-soft px-1.5 py-0.5 text-xs font-semibold text-sales">売上</span>
  ) : (
    <span className="inline-block rounded-md bg-expense-soft px-1.5 py-0.5 text-xs font-semibold text-expense">経費</span>
  );
}

export function DepositBadge({ status }: { status: DepositStatus | null }) {
  if (!status) return null;
  return (
    <span
      className={`inline-block rounded-md px-1.5 py-0.5 text-xs font-semibold ${
        status === "paid" ? "bg-brand-soft text-brand-dark" : "bg-warn-soft text-warn"
      }`}
    >
      {DEPOSIT_LABEL[status]}
    </span>
  );
}
