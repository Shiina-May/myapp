import type { DepositStatus, EvidenceType, TxType } from "@/lib/types";

export type TxInput = {
  type: TxType;
  date: string;
  counterparty: string;
  description: string;
  account_id: string;
  payment_method_id: string | null;
  amount: number;
  business_ratio: number;
  deposit_status: DepositStatus | null;
  deposit_date: string | null;
  evidence_type: EvidenceType;
  memo: string;
};

export type FieldErrors = Partial<Record<keyof TxInput, string>>;

const EVIDENCE: EvidenceType[] = ["none", "paper", "receipt_image", "invoice_image", "electronic"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidDate(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** "1,200" や "１２００円" も受け付けて整数に変換 */
export function parseAmount(raw: string): number | null {
  const s = raw
    .normalize("NFKC")
    .replace(/[,\s円¥￥]/g, "");
  if (!/^\d{1,9}$/.test(s)) return null;
  return Number(s);
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export function parseTxForm(fd: FormData): { data?: TxInput; errors?: FieldErrors } {
  const errors: FieldErrors = {};
  const type = str(fd, "type") as TxType;
  if (type !== "expense" && type !== "sales") errors.type = "種別を選んでください";

  const date = str(fd, "date");
  if (!isValidDate(date)) errors.date = type === "sales" ? "売上日を入力してください" : "日付を入力してください";

  const counterparty = str(fd, "counterparty");
  if (!counterparty) errors.counterparty = type === "sales" ? "入金元を入力してください" : "支払先を入力してください";
  else if (counterparty.length > 100) errors.counterparty = "100文字以内で入力してください";

  const description = str(fd, "description");
  if (description.length > 200) errors.description = "200文字以内で入力してください";

  const account_id = str(fd, "account_id");
  if (!UUID.test(account_id)) errors.account_id = "勘定科目を選んでください";

  const pm = str(fd, "payment_method_id");
  const payment_method_id = pm ? pm : null;
  if (payment_method_id && !UUID.test(payment_method_id)) errors.payment_method_id = "支払方法が不正です";

  const amount = parseAmount(str(fd, "amount"));
  if (amount === null) errors.amount = "金額を数字で入力してください（0〜999,999,999）";

  let business_ratio = 100;
  if (type === "expense") {
    const r = Number(str(fd, "business_ratio") || "100");
    if (!Number.isInteger(r) || r < 0 || r > 100) errors.business_ratio = "0〜100の整数で入力してください";
    else business_ratio = r;
  }

  let deposit_status: DepositStatus | null = null;
  let deposit_date: string | null = null;
  if (type === "sales") {
    deposit_status = str(fd, "deposit_status") === "paid" ? "paid" : "unpaid";
    const dd = str(fd, "deposit_date");
    if (deposit_status === "paid" && dd) {
      if (!isValidDate(dd)) errors.deposit_date = "入金日が正しくありません";
      else deposit_date = dd;
    }
  }

  const ev = str(fd, "evidence_type") as EvidenceType;
  const evidence_type: EvidenceType = EVIDENCE.includes(ev) ? ev : "none";

  const memo = str(fd, "memo");
  if (memo.length > 500) errors.memo = "500文字以内で入力してください";

  if (Object.keys(errors).length) return { errors };
  return {
    data: {
      type,
      date,
      counterparty,
      description,
      account_id,
      payment_method_id,
      amount: amount!,
      business_ratio,
      deposit_status,
      deposit_date,
      evidence_type,
      memo,
    },
  };
}

/** 経費算入額（DBの計算式と同じ：1円未満切り捨て） */
export function deductible(type: TxType, amount: number, ratio: number) {
  return type === "expense" ? Math.floor((amount * ratio) / 100) : amount;
}
