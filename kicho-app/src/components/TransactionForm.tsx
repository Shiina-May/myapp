"use client";

import Link from "next/link";
import { startTransition, useActionState, useMemo, useState } from "react";
import { saveTransaction, type TxFormState } from "@/app/(app)/transactions/actions";
import { displayId, yen } from "@/lib/format";
import {
  EVIDENCE_LABEL,
  type Account,
  type EvidenceType,
  type PaymentMethod,
  type Transaction,
  type TxType,
} from "@/lib/types";
import { deductible, parseAmount } from "@/lib/validate";

type Props = {
  accounts: Account[];
  paymentMethods: PaymentMethod[];
  counterparties: string[];
  initial?: Transaction | null;
  defaultType?: TxType;
  defaultDate: string;
};

function Field({
  label,
  error,
  hint,
  children,
  required,
}: {
  label: string;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-baseline gap-1 text-sm font-medium">
        {label}
        {required && <span className="text-xs text-expense">*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-sub">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-expense">{error}</span>}
    </label>
  );
}

export function TransactionForm({ accounts, paymentMethods, counterparties, initial, defaultType, defaultDate }: Props) {
  const [state, action, pending] = useActionState<TxFormState, FormData>(saveTransaction, undefined);
  const fe = state?.fieldErrors ?? {};
  const isEdit = !!initial;

  const [type, setType] = useState<TxType>(initial?.type ?? defaultType ?? "expense");

  const accountsFor = (t: TxType) =>
    accounts.filter((a) => a.kind === t && (a.is_active || a.id === initial?.account_id));
  const visiblePayments = paymentMethods.filter((p) => p.is_active || p.id === initial?.payment_method_id);

  const defaultAccount = (t: TxType) => accountsFor(t)[0]?.id ?? "";
  const bankId = paymentMethods.find((p) => p.name === "銀行振込")?.id ?? "";

  const [accountId, setAccountId] = useState(initial?.account_id ?? defaultAccount(type));
  const [paymentId, setPaymentId] = useState(
    initial ? (initial.payment_method_id ?? "") : type === "sales" ? bankId : "",
  );
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [ratio, setRatio] = useState(String(initial?.business_ratio ?? 100));
  const [depositStatus, setDepositStatus] = useState(initial?.deposit_status ?? "unpaid");

  const switchType = (t: TxType) => {
    setType(t);
    if (!accountsFor(t).some((a) => a.id === accountId)) setAccountId(defaultAccount(t));
    if (!isEdit && t === "sales" && !paymentId) setPaymentId(bankId);
  };

  const parsedAmount = parseAmount(amount);
  const ratioNum = Number(ratio);
  const preview = useMemo(
    () =>
      parsedAmount !== null && Number.isInteger(ratioNum) && ratioNum >= 0 && ratioNum <= 100
        ? deductible("expense", parsedAmount, ratioNum)
        : null,
    [parsedAmount, ratioNum],
  );

  const isSales = type === "sales";

  return (
    <form
      // action={} を使うと React がエラー時に入力欄を空にするため、onSubmit で送信する
      onSubmit={(e) => {
        e.preventDefault();
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
        const fd = new FormData(e.currentTarget, submitter);
        startTransition(() => action(fd));
      }}
      className="space-y-5"
      noValidate
    >
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="type" value={type} />

      {initial && (
        <p className="text-sm text-sub">
          取引ID <span className="num font-mono font-semibold text-ink">{displayId(initial.display_no)}</span>
        </p>
      )}

      {/* 種別 */}
      <div role="radiogroup" aria-label="種別" className="grid grid-cols-2 rounded-xl bg-black/[0.05] p-1">
        {(["expense", "sales"] as const).map((t) => {
          const on = type === t;
          return (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => switchType(t)}
              className={`rounded-lg py-2.5 text-[15px] font-semibold transition ${
                on ? (t === "expense" ? "bg-white text-expense shadow-sm" : "bg-white text-sales shadow-sm") : "text-sub"
              }`}
            >
              {t === "expense" ? "経費" : "売上"}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label={isSales ? "売上日" : "日付"} error={fe.date} required hint={isSales ? "集計はこの日付で行います" : undefined}>
          <input
            name="date"
            type="date"
            defaultValue={initial?.date ?? defaultDate}
            required
            className="field"
            aria-invalid={!!fe.date}
          />
        </Field>

        <Field label="金額" error={fe.amount} required>
          <div className="relative">
            <input
              name="amount"
              inputMode="numeric"
              autoComplete="off"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="field num pr-10 text-right text-lg font-semibold"
              aria-invalid={!!fe.amount}
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sub">円</span>
          </div>
        </Field>

        <Field label={isSales ? "入金元（取引先）" : "支払先"} error={fe.counterparty} required>
          <input
            name="counterparty"
            list="counterparty-list"
            defaultValue={initial?.counterparty ?? ""}
            autoComplete="off"
            placeholder={isSales ? "例：株式会社○○" : "例：Starbucks Coffee"}
            className="field"
            aria-invalid={!!fe.counterparty}
          />
          <datalist id="counterparty-list">
            {counterparties.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>

        <Field label="内容" error={fe.description}>
          <input
            name="description"
            defaultValue={initial?.description ?? ""}
            placeholder={isSales ? "例：Web記事作成" : "例：作業用軽食"}
            className="field"
          />
        </Field>

        <Field label="勘定科目" error={fe.account_id} required>
          <select
            name="account_id"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="field"
            aria-invalid={!!fe.account_id}
          >
            {accountsFor(type).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
                {a.is_active ? "" : "（非表示中）"}
              </option>
            ))}
          </select>
        </Field>

        <Field label={isSales ? "入金方法" : "支払方法"} error={fe.payment_method_id}>
          <select name="payment_method_id" value={paymentId} onChange={(e) => setPaymentId(e.target.value)} className="field">
            <option value="">（未選択）</option>
            {visiblePayments.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.is_active ? "" : "（非表示中）"}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* 経費: 家事按分 */}
      {!isSales && (
        <div className="rounded-xl border border-line bg-white p-4">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="事業利用割合" error={fe.business_ratio}>
              <div className="relative w-28">
                <input
                  name="business_ratio"
                  inputMode="numeric"
                  value={ratio}
                  onChange={(e) => setRatio(e.target.value.replace(/[^\d]/g, "").slice(0, 3))}
                  className="field num pr-8 text-right"
                  aria-invalid={!!fe.business_ratio}
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sub">%</span>
              </div>
            </Field>
            <div className="flex gap-1.5 pb-1">
              {[100, 80, 60, 50].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRatio(String(r))}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    ratio === String(r) ? "border-brand bg-brand-soft text-brand-dark" : "border-line text-sub"
                  }`}
                >
                  {r}%
                </button>
              ))}
            </div>
          </div>
          <p className="mt-3 text-sm text-sub">
            経費算入額：
            <span className="num font-semibold text-ink">{preview === null ? "—" : yen(preview)}</span>
            {ratio !== "100" && <span className="ml-2 text-xs">（1円未満切り捨て）</span>}
          </p>
        </div>
      )}

      {/* 売上: 入金管理 */}
      {isSales && (
        <div className="rounded-xl border border-line bg-white p-4">
          <span className="mb-2 block text-sm font-medium">入金状況</span>
          <div className="mb-3 flex gap-2">
            {(["unpaid", "paid"] as const).map((s) => (
              <label
                key={s}
                className={`cursor-pointer rounded-full border px-4 py-2 text-sm ${
                  depositStatus === s
                    ? s === "paid"
                      ? "border-brand bg-brand-soft font-semibold text-brand-dark"
                      : "border-warn bg-warn-soft font-semibold text-warn"
                    : "border-line text-sub"
                }`}
              >
                <input
                  type="radio"
                  name="deposit_status"
                  value={s}
                  checked={depositStatus === s}
                  onChange={() => setDepositStatus(s)}
                  className="sr-only"
                />
                {s === "paid" ? "入金済み" : "未入金"}
              </label>
            ))}
          </div>
          {depositStatus === "paid" && (
            <Field label="入金日" error={fe.deposit_date} hint="空欄でも登録できます">
              <input
                name="deposit_date"
                type="date"
                defaultValue={initial?.deposit_date ?? ""}
                className="field md:w-56"
                aria-invalid={!!fe.deposit_date}
              />
            </Field>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="証憑" hint="レシート画像の添付はPhase 3で追加します">
          <select
            key={isEdit ? "evidence" : type}
            name="evidence_type"
            defaultValue={initial?.evidence_type ?? (isSales ? "none" : "paper")} className="field">
            {(Object.keys(EVIDENCE_LABEL) as EvidenceType[]).map((k) => (
              <option key={k} value={k}>
                {EVIDENCE_LABEL[k]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="備考" error={fe.memo}>
          <input name="memo" defaultValue={initial?.memo ?? ""} placeholder="例：MTG中の軽飲食として購入" className="field" />
        </Field>
      </div>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-expense-soft px-3 py-2 text-sm text-expense">
          {state.error}
        </p>
      )}

      <div className="sticky bottom-20 z-10 -mx-4 flex flex-wrap gap-2 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-60 md:flex-none"
        >
          {pending ? "保存中…" : isEdit ? "変更を保存" : "登録"}
        </button>
        {!isEdit && (
          <button
            type="submit"
            name="next"
            value="new"
            disabled={pending}
            className="rounded-xl border border-brand px-4 py-3 font-semibold text-brand hover:bg-brand-soft disabled:opacity-60"
          >
            登録して続けて入力
          </button>
        )}
        <Link href="/transactions" className="rounded-xl px-4 py-3 text-sub hover:bg-black/[0.04]">
          キャンセル
        </Link>
      </div>
    </form>
  );
}
