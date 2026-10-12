"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { displayId } from "@/lib/format";
import { parseTxForm, type FieldErrors } from "@/lib/validate";

export type TxFormState = { error?: string; fieldErrors?: FieldErrors } | undefined;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function dbMessage(msg: string) {
  if (msg.includes("種別と勘定科目")) return "種別と勘定科目が一致していません（売上には売上用の科目を選んでください）";
  if (msg.includes("勘定科目が見つかりません")) return "勘定科目が見つかりません";
  if (msg.includes("支払方法が見つかりません")) return "支払方法が見つかりません";
  return "保存できませんでした。時間をおいてもう一度お試しください。";
}

export async function saveTransaction(_prev: TxFormState, formData: FormData): Promise<TxFormState> {
  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("next") ?? "");
  const { data, errors } = parseTxForm(formData);
  if (!data) return { error: "入力内容を確認してください", fieldErrors: errors };

  const supabase = await createClient();
  let displayNo: number;

  if (id) {
    if (!UUID.test(id)) return { error: "取引が見つかりません" };
    const { data: row, error } = await supabase
      .from("transactions")
      .update(data)
      .eq("id", id)
      .is("deleted_at", null)
      .select("display_no")
      .maybeSingle();
    if (error) return { error: dbMessage(error.message) };
    if (!row) return { error: "取引が見つかりません（削除された可能性があります）" };
    displayNo = row.display_no;
  } else {
    const { data: row, error } = await supabase.from("transactions").insert(data).select("display_no").single();
    if (error) return { error: dbMessage(error.message) };
    displayNo = row.display_no;
  }

  revalidatePath("/", "layout");
  const saved = encodeURIComponent(displayId(displayNo));
  if (next === "new") redirect(`/transactions/new?type=${data.type}&date=${data.date}&saved=${saved}`);
  const [y, m] = data.date.split("-");
  redirect(`/transactions?year=${y}&month=${Number(m)}&saved=${saved}`);
}

export async function deleteTransaction(id: string) {
  if (!UUID.test(id)) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);
  revalidatePath("/", "layout");
  return { ok: !error };
}

export async function restoreTransaction(id: string) {
  if (!UUID.test(id)) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").update({ deleted_at: null }).eq("id", id);
  revalidatePath("/", "layout");
  return { ok: !error };
}
