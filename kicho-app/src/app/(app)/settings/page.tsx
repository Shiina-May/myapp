import { PageHeader } from "@/components/PageHeader";
import { getMasters } from "@/lib/masters";
import { addItem, moveItem, renameItem, toggleItem } from "./actions";

type Row = { id: string; name: string; is_active: boolean };

function MasterList({ title, table, kind, rows, note }: { title: string; table: string; kind?: string; rows: Row[]; note?: string }) {
  return (
    <section className="rounded-2xl border border-line bg-white">
      <div className="border-b border-line px-4 py-3">
        <h2 className="font-bold">{title}</h2>
        {note && <p className="mt-0.5 text-xs text-sub">{note}</p>}
      </div>
      <ul className="divide-y divide-line/70">
        {rows.map((r, i) => (
          <li key={r.id} className={`flex items-center gap-2 px-3 py-2 ${r.is_active ? "" : "bg-paper/70"}`}>
            <form action={moveItem} className="flex flex-col">
              <input type="hidden" name="table" value={table} />
              <input type="hidden" name="id" value={r.id} />
              {kind && <input type="hidden" name="kind" value={kind} />}
              <button name="dir" value="up" disabled={i === 0} className="px-1 text-xs leading-none text-mute disabled:opacity-25" aria-label="上へ">
                ▲
              </button>
              <button
                name="dir"
                value="down"
                disabled={i === rows.length - 1}
                className="px-1 text-xs leading-none text-mute disabled:opacity-25"
                aria-label="下へ"
              >
                ▼
              </button>
            </form>
            <form action={renameItem} className="flex min-w-0 flex-1 gap-2">
              <input type="hidden" name="table" value={table} />
              <input type="hidden" name="id" value={r.id} />
              <input
                name="name"
                defaultValue={r.name}
                aria-label="名前"
                className={`min-w-0 flex-1 rounded-lg border border-transparent px-2 py-1.5 text-[15px] hover:border-line focus:border-brand focus:outline-none ${
                  r.is_active ? "" : "text-mute line-through"
                }`}
              />
              <button className="shrink-0 rounded-lg px-2 text-xs text-brand hover:bg-brand-soft">保存</button>
            </form>
            <form action={toggleItem}>
              <input type="hidden" name="table" value={table} />
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="active" value={String(r.is_active)} />
              <button className="shrink-0 rounded-lg border border-line px-2 py-1 text-xs text-sub hover:bg-black/[0.04]">
                {r.is_active ? "非表示にする" : "表示する"}
              </button>
            </form>
          </li>
        ))}
      </ul>
      <form action={addItem} className="flex gap-2 border-t border-line p-3">
        <input type="hidden" name="table" value={table} />
        {kind && <input type="hidden" name="kind" value={kind} />}
        <input name="name" placeholder="新しく追加" className="field" required />
        <button className="shrink-0 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark">追加</button>
      </form>
    </section>
  );
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { accounts, paymentMethods } = await getMasters();
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="設定"
        sub="名前を変えると過去の取引にも反映されます。使わなくなったものは「非表示」にしてください（帳簿を守るため削除はできません）。"
      />
      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-expense-soft px-3 py-2 text-sm text-expense">
          {error}
        </p>
      )}
      <div className="grid gap-5 lg:grid-cols-3">
        <MasterList title="勘定科目（経費）" table="accounts" kind="expense" rows={accounts.filter((a) => a.kind === "expense")} />
        <div className="space-y-5">
          <MasterList title="勘定科目（売上）" table="accounts" kind="sales" rows={accounts.filter((a) => a.kind === "sales")} />
        </div>
        <MasterList title="支払方法・入金方法" table="payment_methods" rows={paymentMethods} />
      </div>
    </div>
  );
}
