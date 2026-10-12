import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Account, PaymentMethod } from "@/lib/types";

/** 勘定科目・支払方法を取得。初回（空）の場合は初期マスタを作成する。 */
export async function getMasters() {
  const supabase = await createClient();
  // retry=true のときはURLを変える：Next.js は同じ描画内の同一GETリクエストを
  // 使い回す（Request Memoization）ため、初期マスタ作成直後の再取得が空のままになるのを防ぐ
  const NIL = "00000000-0000-0000-0000-000000000000";
  const load = (retry = false) => {
    let a = supabase.from("accounts").select("id,name,kind,sort_order,is_active");
    let p = supabase.from("payment_methods").select("id,name,sort_order,is_active");
    if (retry) {
      a = a.neq("id", NIL);
      p = p.neq("id", NIL);
    }
    return Promise.all([a.order("sort_order").order("name"), p.order("sort_order").order("name")]);
  };

  let [acc, pay] = await load();
  if (acc.error) throw acc.error;
  if (pay.error) throw pay.error;

  if ((acc.data?.length ?? 0) === 0 || (pay.data?.length ?? 0) === 0) {
    const { error } = await supabase.rpc("ensure_defaults");
    if (error) throw error;
    [acc, pay] = await load(true);
    if (acc.error) throw acc.error;
    if (pay.error) throw pay.error;
  }

  return {
    accounts: (acc.data ?? []) as Account[],
    paymentMethods: (pay.data ?? []) as PaymentMethod[],
  };
}
