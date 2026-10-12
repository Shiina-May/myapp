import Link from "next/link";
import { ConfirmButton } from "@/components/ConfirmButton";
import { FilterBar } from "@/components/FilterBar";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { DepositBadge, TypeBadge } from "@/components/TxBadges";
import { currentYearJST, displayId, parseDisplayId, slashDate, yen } from "@/lib/format";
import { getMasters } from "@/lib/masters";
import { createClient } from "@/lib/supabase/server";
import { TX_COLUMNS } from "@/lib/transactions";
import { EVIDENCE_LABEL, type Transaction } from "@/lib/types";
import { deleteTransaction } from "./actions";

type SP = { year?: string; month?: string; type?: string; q?: string; saved?: string };

function lastDay(y: number, m: number) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const thisYear = currentYearJST();
  const year = Number(sp.year) >= 2000 && Number(sp.year) <= 2100 ? Number(sp.year) : thisYear;
  const month = Number(sp.month) >= 1 && Number(sp.month) <= 12 ? Number(sp.month) : null;
  const type = sp.type === "sales" || sp.type === "expense" ? sp.type : "";
  const q = (sp.q ?? "").trim().slice(0, 50);
  const idNo = q ? parseDisplayId(q) : null;

  const supabase = await createClient();
  let query = supabase.from("transactions").select(TX_COLUMNS).is("deleted_at", null);

  if (idNo !== null) {
    // ID検索は年月に関係なく探す
    query = query.eq("display_no", idNo);
  } else {
    const from = month ? `${year}-${String(month).padStart(2, "0")}-01` : `${year}-01-01`;
    const to = month ? `${year}-${String(month).padStart(2, "0")}-${lastDay(year, month)}` : `${year}-12-31`;
    query = query.gte("date", from).lte("date", to);
    if (type) query = query.eq("type", type);
    if (q) {
      const s = q.replace(/[%_,()*\\"]/g, " ").trim();
      if (s) query = query.or(`counterparty.ilike.%${s}%,description.ilike.%${s}%,memo.ilike.%${s}%`);
    }
  }

  const [{ data, error }, { accounts, paymentMethods }, first] = await Promise.all([
    query.order("date", { ascending: false }).order("display_no", { ascending: false }).limit(3000),
    getMasters(),
    supabase.from("transactions").select("date").is("deleted_at", null).order("date").limit(1).maybeSingle(),
  ]);

  const rows = (data ?? []) as unknown as Transaction[];
  const accName = new Map(accounts.map((a) => [a.id, a.name]));
  const payName = new Map(paymentMethods.map((p) => [p.id, p.name]));

  const firstYear = first.data ? Number(String(first.data.date).slice(0, 4)) : thisYear;
  const years: number[] = [];
  for (let y = thisYear + 1; y >= Math.min(firstYear, thisYear, year); y--) years.push(y);

  const salesTotal = rows.filter((r) => r.type === "sales").reduce((s, r) => s + r.amount, 0);
  const expenseTotal = rows.filter((r) => r.type === "expense").reduce((s, r) => s + r.deductible_amount, 0);

  const scope = idNo !== null ? `ID ${displayId(idNo)}` : `${year}年${month ? `${month}月` : ""}`;

  return (
    <div>
      <PageHeader
        title="取引"
        actions={
          <>
            <Link href="/transactions/trash" className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-sub hover:bg-black/[0.05]">
              <Icon name="trash" className="size-4" />
              ゴミ箱
            </Link>
            <Link
              href="/transactions/new"
              className="inline-flex items-center gap-1 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              <Icon name="plus" className="size-4" />
              取引を追加
            </Link>
          </>
        }
      />

      {sp.saved && (
        <p role="status" className="mb-4 rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand-dark">
          {sp.saved} を保存しました。
        </p>
      )}

      <FilterBar years={years} year={year} month={month} type={type} q={q} />

      {error && <p className="mb-4 rounded-lg bg-expense-soft px-3 py-2 text-sm text-expense">読み込みに失敗しました。</p>}

      <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-sub">
        <span>
          {scope}：<b className="num text-ink">{rows.length}</b>件
        </span>
        {type !== "expense" && (
          <span>
            売上 <b className="num text-sales">{yen(salesTotal)}</b>
          </span>
        )}
        {type !== "sales" && (
          <span>
            経費（算入額） <b className="num text-expense">{yen(expenseTotal)}</b>
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-sub">
          該当する取引はありません。
        </div>
      ) : (
        <>
          {/* PC: 表 */}
          <div className="hidden overflow-x-auto rounded-2xl border border-line bg-white md:block">
            <table className="w-full text-[13px] lg:text-sm">
              <thead className="border-b border-line bg-paper/60 text-left text-xs text-sub">
                <tr>
                  {["ID", "日付", "支払先／入金元", "内容", "種別", "勘定科目", "金額", "支払方法", "備考", "証憑", ""].map((h, i) => (
                    <th key={i} className={`px-2 py-2.5 font-medium whitespace-nowrap ${h === "金額" ? "text-right" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-line/70 last:border-0 hover:bg-paper/50">
                    <td className="num px-2 py-2 font-mono text-xs whitespace-nowrap text-sub">{displayId(r.display_no)}</td>
                    <td className="num px-2 py-2 whitespace-nowrap">{slashDate(r.date)}</td>
                    <td className="max-w-40 truncate px-2 py-2 font-medium" title={r.counterparty}>
                      {r.counterparty}
                    </td>
                    <td className="max-w-36 truncate px-2 py-2" title={r.description}>
                      {r.description}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-1">
                        <TypeBadge type={r.type} />
                        <DepositBadge status={r.deposit_status} />
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">{accName.get(r.account_id) ?? "—"}</td>
                    <td className="num px-2 py-2 text-right whitespace-nowrap">
                      <span className={`font-semibold ${r.type === "sales" ? "text-sales" : ""}`}>{yen(r.amount)}</span>
                      {r.type === "expense" && r.business_ratio < 100 && (
                        <span className="block text-xs text-sub">
                          算入 {yen(r.deductible_amount)}（{r.business_ratio}%）
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {r.payment_method_id ? (payName.get(r.payment_method_id) ?? "—") : "—"}
                    </td>
                    <td className="max-w-36 truncate px-2 py-2 text-sub" title={r.memo}>
                      {r.memo}
                    </td>
                    <td className="px-2 py-2 text-xs whitespace-nowrap text-sub">{EVIDENCE_LABEL[r.evidence_type]}</td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="flex justify-end">
                        <Link
                          href={`/transactions/${r.id}/edit`}
                          className="rounded-lg p-1.5 text-sub hover:bg-black/[0.05]"
                          aria-label="編集"
                          title="編集"
                        >
                          <Icon name="edit" className="size-4" />
                        </Link>
                        <DeleteTx tx={r} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* スマホ: カード */}
          <ul className="space-y-2 md:hidden">
            {rows.map((r) => (
              <li key={r.id} className="rounded-2xl border border-line bg-white p-3.5">
                <div className="mb-1 flex items-center justify-between text-xs text-sub">
                  <span className="num">
                    {slashDate(r.date)}
                    <span className="ml-2 font-mono">{displayId(r.display_no)}</span>
                  </span>
                  <span className="flex gap-1">
                    <TypeBadge type={r.type} />
                    <DepositBadge status={r.deposit_status} />
                  </span>
                </div>
                <Link href={`/transactions/${r.id}/edit`} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{r.counterparty}</p>
                    <p className="truncate text-sm text-sub">{r.description || "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className={`num font-bold ${r.type === "sales" ? "text-sales" : ""}`}>{yen(r.amount)}</p>
                    {r.type === "expense" && r.business_ratio < 100 && (
                      <p className="num text-xs text-sub">算入 {yen(r.deductible_amount)}</p>
                    )}
                  </div>
                </Link>
                <div className="mt-2 flex items-center justify-between">
                  <p className="truncate text-xs text-sub">
                    {accName.get(r.account_id)} ・ {r.payment_method_id ? payName.get(r.payment_method_id) : "支払方法なし"} ・{" "}
                    {EVIDENCE_LABEL[r.evidence_type]}
                  </p>
                  <DeleteTx tx={r} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function DeleteTx({ tx }: { tx: Transaction }) {
  return (
    <ConfirmButton
      action={deleteTransaction.bind(null, tx.id)}
      title="この取引を削除しますか？"
      message={
        <>
          <span className="font-mono">{displayId(tx.display_no)}</span>　{slashDate(tx.date)}　{tx.counterparty}　{yen(tx.amount)}
          <br />
          削除した取引は「ゴミ箱」から元に戻せます。
        </>
      }
      confirmLabel="削除する"
      label="削除"
      icon="trash"
      danger
      iconOnly
      className="rounded-lg p-1.5 text-sub hover:bg-black/[0.05]"
    />
  );
}
