import Link from "next/link";
import { ConfirmButton } from "@/components/ConfirmButton";
import { PageHeader } from "@/components/PageHeader";
import { TypeBadge } from "@/components/TxBadges";
import { displayId, slashDate, yen } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { TX_COLUMNS } from "@/lib/transactions";
import type { Transaction } from "@/lib/types";
import { restoreTransaction } from "../actions";

export default async function TrashPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select(TX_COLUMNS)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false })
    .limit(500);
  const rows = (data ?? []) as unknown as Transaction[];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="ゴミ箱"
        sub="削除した取引は集計に含まれません。帳簿の保存義務（7年）があるため自動では消去しません。"
        actions={
          <Link href="/transactions" className="rounded-xl px-3 py-2 text-sm text-sub hover:bg-black/[0.05]">
            ← 取引一覧へ
          </Link>
        }
      />
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-sub">ゴミ箱は空です。</div>
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 p-3.5">
              <div className="min-w-0">
                <p className="num text-xs text-sub">
                  <span className="font-mono">{displayId(r.display_no)}</span>　{slashDate(r.date)}　
                  <TypeBadge type={r.type} />
                </p>
                <p className="truncate font-medium">
                  {r.counterparty}
                  <span className="ml-2 text-sm font-normal text-sub">{r.description}</span>
                </p>
                <p className="num text-sm">{yen(r.amount)}</p>
              </div>
              <ConfirmButton
                action={restoreTransaction.bind(null, r.id)}
                title="この取引を元に戻しますか？"
                message={
                  <>
                    <span className="font-mono">{displayId(r.display_no)}</span> は同じIDのまま取引一覧と集計に戻ります。
                  </>
                }
                confirmLabel="元に戻す"
                label="元に戻す"
                icon="restore"
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-sm text-brand hover:bg-brand-soft"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
