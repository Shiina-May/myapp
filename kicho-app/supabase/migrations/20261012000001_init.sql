-- =====================================================================
-- 記帳アプリ Phase 1: 基本テーブル
--   accounts         勘定科目
--   payment_methods  支払方法 / 入金方法
--   transactions     取引（売上・経費）
--   audit_logs       変更履歴（電子帳簿保存法対策・アプリからは読み取り専用）
-- すべてのテーブルは RLS で「ログインした本人のデータだけ」に制限する。
-- =====================================================================

-- ---------- 共通: updated_at 自動更新 ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- 勘定科目 ----------
create table public.accounts (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 40),
  kind        text not null check (kind in ('expense', 'sales')),
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (owner_id, name)
);
create trigger accounts_updated_at before update on public.accounts
  for each row execute function public.set_updated_at();

-- ---------- 支払方法 ----------
create table public.payment_methods (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 40),
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (owner_id, name)
);
create trigger payment_methods_updated_at before update on public.payment_methods
  for each row execute function public.set_updated_at();

-- ---------- 取引 ----------
-- display_no: 画面・CSVに出す通し番号（T-000123）。
--   IDENTITY 列はシーケンスで採番され、削除・ロールバックしても巻き戻らない
--   → 削除済みの番号が再利用されることはない。年をまたいでもリセットしない。
create table public.transactions (
  id                 uuid primary key default gen_random_uuid(),
  display_no         bigint generated always as identity unique,
  owner_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type               text not null check (type in ('expense', 'sales')),
  date               date not null,                       -- 経費: 支払日 / 売上: 売上日（集計の基準）
  counterparty       text not null default '' check (char_length(counterparty) <= 100), -- 支払先 / 入金元
  description        text not null default '' check (char_length(description) <= 200),
  account_id         uuid not null references public.accounts (id) on delete restrict,
  payment_method_id  uuid references public.payment_methods (id) on delete restrict,
  amount             integer not null check (amount between 0 and 999999999), -- 実際の金額（常に正）
  business_ratio     smallint not null default 100 check (business_ratio between 0 and 100),
  -- 経費算入額: 経費は 金額×事業利用割合（1円未満切り捨て）、売上は金額そのまま
  deductible_amount  integer generated always as (
                       case when type = 'expense'
                            then floor(amount::numeric * business_ratio / 100)::integer
                            else amount end
                     ) stored,
  deposit_status     text check (deposit_status in ('unpaid', 'paid')),
  deposit_date       date,                                -- 入金日（未入金なら空欄）
  evidence_type      text not null default 'none'
                       check (evidence_type in ('none', 'paper', 'receipt_image', 'invoice_image', 'electronic')),
  memo               text not null default '' check (char_length(memo) <= 500),
  deleted_at         timestamptz,                          -- 論理削除（ゴミ箱）
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint transactions_type_fields check (
    (type = 'expense' and deposit_status is null and deposit_date is null)
    or
    (type = 'sales' and business_ratio = 100 and deposit_status is not null
       and (deposit_status = 'paid' or deposit_date is null))
  )
);

create index transactions_owner_date_idx on public.transactions (owner_id, date) where deleted_at is null;
create index transactions_owner_counterparty_idx on public.transactions (owner_id, counterparty) where deleted_at is null;

create trigger transactions_updated_at before update on public.transactions
  for each row execute function public.set_updated_at();

-- 勘定科目の種類（経費用/売上用）と取引の種別が一致しているか確認する
create or replace function public.check_transaction_account()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  acc_kind text;
begin
  select kind into acc_kind from public.accounts
   where id = new.account_id and owner_id = new.owner_id;
  if acc_kind is null then
    raise exception '勘定科目が見つかりません';
  end if;
  if acc_kind <> new.type then
    raise exception '種別と勘定科目が一致していません';
  end if;
  if new.payment_method_id is not null and not exists (
    select 1 from public.payment_methods
     where id = new.payment_method_id and owner_id = new.owner_id) then
    raise exception '支払方法が見つかりません';
  end if;
  return new;
end;
$$;
create trigger transactions_check_account before insert or update on public.transactions
  for each row execute function public.check_transaction_account();

-- ---------- 変更履歴 ----------
create table public.audit_logs (
  id          bigint generated always as identity primary key,
  owner_id    uuid not null,
  table_name  text not null,
  row_id      uuid not null,
  action      text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_data    jsonb,
  new_data    jsonb,
  changed_at  timestamptz not null default now()
);
create index audit_logs_row_idx on public.audit_logs (row_id, changed_at);

-- security definer: アプリ（authenticated）からは audit_logs に書き込めないが、
-- トリガー経由でのみ記録される。
create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs (owner_id, table_name, row_id, action, new_data)
    values (new.owner_id, tg_table_name, new.id, tg_op, to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_logs (owner_id, table_name, row_id, action, old_data, new_data)
    values (new.owner_id, tg_table_name, new.id, tg_op, to_jsonb(old), to_jsonb(new));
    return new;
  else
    insert into public.audit_logs (owner_id, table_name, row_id, action, old_data)
    values (old.owner_id, tg_table_name, old.id, tg_op, to_jsonb(old));
    return old;
  end if;
end;
$$;
create trigger transactions_audit after insert or update or delete on public.transactions
  for each row execute function public.write_audit_log();

-- ---------- RLS ----------
alter table public.accounts        enable row level security;
alter table public.payment_methods enable row level security;
alter table public.transactions    enable row level security;
alter table public.audit_logs      enable row level security;

create policy accounts_owner on public.accounts
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy payment_methods_owner on public.payment_methods
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- 取引は「完全削除」させない（DELETE ポリシーを作らない＝論理削除のみ）
create policy transactions_select on public.transactions
  for select to authenticated using (owner_id = (select auth.uid()));
create policy transactions_insert on public.transactions
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy transactions_update on public.transactions
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy audit_logs_select on public.audit_logs
  for select to authenticated using (owner_id = (select auth.uid()));

-- マスタの削除は不可（非表示で対応）。取引に使われている科目を消すと帳簿が壊れるため。
revoke delete on public.accounts, public.payment_methods, public.transactions from anon, authenticated;
revoke insert, update, delete on public.audit_logs from anon, authenticated;
revoke all on public.accounts, public.payment_methods, public.transactions, public.audit_logs from anon;

-- ---------- 初期マスタ（「記帳 2026年」で使用中の科目・支払方法） ----------
-- 初回ログイン後にアプリから呼ばれる。既にあるものは追加しない。
create or replace function public.ensure_defaults()
returns void
language plpgsql
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  insert into public.accounts (owner_id, name, kind, sort_order)
  select uid, v.name, v.kind, v.ord
    from (values
      ('会議費', 'expense', 10),
      ('消耗品費', 'expense', 20),
      ('交際費', 'expense', 30),
      ('通信費', 'expense', 40),
      ('ソフトウェア使用料', 'expense', 50),
      ('旅費交通費', 'expense', 60),
      ('新聞図書費', 'expense', 70),
      ('研修費', 'expense', 80),
      ('修繕費', 'expense', 90),
      ('雑費', 'expense', 100),
      ('売上（事業収入）', 'sales', 10)
    ) as v(name, kind, ord)
  on conflict (owner_id, name) do nothing;

  insert into public.payment_methods (owner_id, name, sort_order)
  select uid, v.name, v.ord
    from (values
      ('Suica', 10),
      ('クレカ(JCB)', 20),
      ('現金', 30),
      ('PayPay', 40),
      ('d払い', 50),
      ('メルペイ', 60),
      ('イオンpay', 70),
      ('楽天pay', 80),
      ('銀行振込', 90),
      ('コンビニ振込', 100)
    ) as v(name, ord)
  on conflict (owner_id, name) do nothing;
end;
$$;
revoke execute on function public.ensure_defaults() from anon, public;
grant execute on function public.ensure_defaults() to authenticated;
