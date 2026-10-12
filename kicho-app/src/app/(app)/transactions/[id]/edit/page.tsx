import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { TransactionForm } from "@/components/TransactionForm";
import { todayJST } from "@/lib/format";
import { getMasters } from "@/lib/masters";
import { createClient } from "@/lib/supabase/server";
import { getRecentCounterparties, TX_COLUMNS } from "@/lib/transactions";
import type { Transaction } from "@/lib/types";

export default async function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const [{ data }, { accounts, paymentMethods }, counterparties] = await Promise.all([
    supabase.from("transactions").select(TX_COLUMNS).eq("id", id).is("deleted_at", null).maybeSingle(),
    getMasters(),
    getRecentCounterparties(),
  ]);
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="取引を編集" />
      <TransactionForm
        accounts={accounts}
        paymentMethods={paymentMethods}
        counterparties={counterparties}
        initial={data as unknown as Transaction}
        defaultDate={todayJST()}
      />
    </div>
  );
}
