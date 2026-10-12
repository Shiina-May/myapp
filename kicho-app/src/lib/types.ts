export type TxType = "expense" | "sales";
export type DepositStatus = "unpaid" | "paid";
export type EvidenceType = "none" | "paper" | "receipt_image" | "invoice_image" | "electronic";

export type Account = {
  id: string;
  name: string;
  kind: TxType;
  sort_order: number;
  is_active: boolean;
};

export type PaymentMethod = {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export type Transaction = {
  id: string;
  display_no: number;
  type: TxType;
  date: string; // YYYY-MM-DD（経費: 支払日 / 売上: 売上日）
  counterparty: string;
  description: string;
  account_id: string;
  payment_method_id: string | null;
  amount: number;
  business_ratio: number;
  deductible_amount: number;
  deposit_status: DepositStatus | null;
  deposit_date: string | null;
  evidence_type: EvidenceType;
  memo: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export const TX_TYPE_LABEL: Record<TxType, string> = { expense: "経費", sales: "売上" };

export const DEPOSIT_LABEL: Record<DepositStatus, string> = { unpaid: "未入金", paid: "入金済み" };

export const EVIDENCE_LABEL: Record<EvidenceType, string> = {
  none: "証憑なし",
  paper: "紙で保管",
  receipt_image: "レシート画像",
  invoice_image: "領収書画像",
  electronic: "電子証憑",
};
