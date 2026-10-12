import "server-only";
import { createClient } from "@/lib/supabase/server";

export const TX_COLUMNS =
  "id,display_no,type,date,counterparty,description,account_id,payment_method_id,amount,business_ratio,deductible_amount,deposit_status,deposit_date,evidence_type,memo,deleted_at,created_at,updated_at";

/** 入力候補用：過去に使った支払先・入金元（新しい順・重複なし） */
export async function getRecentCounterparties(limit = 300) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("counterparty")
    .is("deleted_at", null)
    .order("date", { ascending: false })
    .limit(2000);
  const seen = new Set<string>();
  for (const r of data ?? []) {
    const c = (r.counterparty as string).trim();
    if (c && !seen.has(c)) seen.add(c);
    if (seen.size >= limit) break;
  }
  return [...seen];
}
