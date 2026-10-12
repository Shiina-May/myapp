import { PageHeader } from "@/components/PageHeader";
import { TransactionForm } from "@/components/TransactionForm";
import { todayJST } from "@/lib/format";
import { getMasters } from "@/lib/masters";
import { getRecentCounterparties } from "@/lib/transactions";

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; date?: string; saved?: string }>;
}) {
  const sp = await searchParams;
  const [{ accounts, paymentMethods }, counterparties] = await Promise.all([getMasters(), getRecentCounterparties()]);
  const type = sp.type === "sales" ? "sales" : "expense";
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : todayJST();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="取引を追加" sub="レシートがない取引や売上はここから入力します" />
      {sp.saved && (
        <p role="status" className="mb-4 rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand-dark">
          {sp.saved} を登録しました。続けて入力できます。
        </p>
      )}
      {/* key: 連続入力時にフォームを空に戻す */}
      <TransactionForm
        key={sp.saved ?? "new"}
        accounts={accounts}
        paymentMethods={paymentMethods}
        counterparties={counterparties}
        defaultType={type}
        defaultDate={date}
      />
    </div>
  );
}
