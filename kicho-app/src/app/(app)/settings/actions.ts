"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Table = "accounts" | "payment_methods";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function table(v: FormDataEntryValue | null): Table {
  if (v === "accounts" || v === "payment_methods") return v;
  throw new Error("invalid table");
}

function fail(msg: string): never {
  redirect(`/settings?error=${encodeURIComponent(msg)}`);
}

function cleanName(v: FormDataEntryValue | null) {
  const name = String(v ?? "").normalize("NFKC").trim();
  if (!name) fail("名前を入力してください");
  if (name.length > 40) fail("名前は40文字以内にしてください");
  return name;
}

async function orderedIds(t: Table, kind?: string) {
  const supabase = await createClient();
  let q = supabase.from(t).select("id,sort_order").order("sort_order").order("name");
  if (t === "accounts" && kind) q = q.eq("kind", kind);
  const { data } = await q;
  return { supabase, rows: (data ?? []) as { id: string; sort_order: number }[] };
}

export async function addItem(fd: FormData) {
  const t = table(fd.get("table"));
  const name = cleanName(fd.get("name"));
  const kind = t === "accounts" ? (fd.get("kind") === "sales" ? "sales" : "expense") : undefined;
  const { supabase, rows } = await orderedIds(t, kind);
  const sort_order = (rows.at(-1)?.sort_order ?? 0) + 10;
  const { error } = await supabase.from(t).insert(kind ? { name, kind, sort_order } : { name, sort_order });
  if (error) fail(error.code === "23505" ? `「${name}」は既に登録されています` : "追加できませんでした");
  revalidatePath("/", "layout");
  redirect("/settings");
}

export async function renameItem(fd: FormData) {
  const t = table(fd.get("table"));
  const id = String(fd.get("id"));
  if (!UUID.test(id)) fail("対象が見つかりません");
  const name = cleanName(fd.get("name"));
  const supabase = await createClient();
  const { error } = await supabase.from(t).update({ name }).eq("id", id);
  if (error) fail(error.code === "23505" ? `「${name}」は既に登録されています` : "変更できませんでした");
  revalidatePath("/", "layout");
  redirect("/settings");
}

export async function toggleItem(fd: FormData) {
  const t = table(fd.get("table"));
  const id = String(fd.get("id"));
  if (!UUID.test(id)) fail("対象が見つかりません");
  const active = fd.get("active") === "true";
  const supabase = await createClient();
  const { error } = await supabase.from(t).update({ is_active: !active }).eq("id", id);
  if (error) fail("変更できませんでした");
  revalidatePath("/", "layout");
  redirect("/settings");
}

export async function moveItem(fd: FormData) {
  const t = table(fd.get("table"));
  const id = String(fd.get("id"));
  const dir = fd.get("dir") === "up" ? -1 : 1;
  const kind = t === "accounts" ? String(fd.get("kind")) : undefined;
  const { supabase, rows } = await orderedIds(t, kind);
  const i = rows.findIndex((r) => r.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= rows.length) redirect("/settings");
  const ids = rows.map((r) => r.id);
  [ids[i], ids[j]] = [ids[j], ids[i]];
  // 並び順を 10, 20, 30… に振り直す（変わった行だけ更新）
  await Promise.all(
    ids.map((rid, idx) => {
      const order = (idx + 1) * 10;
      const cur = rows.find((r) => r.id === rid)!;
      return cur.sort_order === order ? null : supabase.from(t).update({ sort_order: order }).eq("id", rid);
    }),
  );
  revalidatePath("/", "layout");
  redirect("/settings");
}
