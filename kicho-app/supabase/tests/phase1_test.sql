-- ローカル検証用（Supabaseには適用しない）
\set ON_ERROR_STOP on
insert into auth.users values ('11111111-1111-1111-1111-111111111111','me@example.com'),
                              ('22222222-2222-2222-2222-222222222222','other@example.com');
set role authenticated;
set request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';
select public.ensure_defaults();
select public.ensure_defaults(); -- 2回呼んでも重複しない
select count(*) as accounts from public.accounts;
select count(*) as payments from public.payment_methods;

-- 経費（按分80%）
insert into public.transactions (type,date,counterparty,description,account_id,payment_method_id,amount,business_ratio,evidence_type)
select 'expense','2026-01-31','SoftBank','携帯料金',a.id,p.id,8163,80,'electronic'
  from public.accounts a, public.payment_methods p where a.name='通信費' and p.name='クレカ(JCB)';
-- 売上（未入金）
insert into public.transactions (type,date,counterparty,description,account_id,payment_method_id,amount,deposit_status)
select 'sales','2026-09-30','株式会社○○','Web記事作成',a.id,p.id,20000,'unpaid'
  from public.accounts a, public.payment_methods p where a.name='売上（事業収入）' and p.name='銀行振込';
select display_no, type, amount, business_ratio, deductible_amount, deposit_status from public.transactions order by display_no;

-- 論理削除→新規追加しても番号は再利用されない
update public.transactions set deleted_at=now() where display_no=2;
insert into public.transactions (type,date,counterparty,account_id,amount)
select 'expense','2026-02-01','DAISO',id,110 from public.accounts where name='消耗品費';
select display_no, counterparty, deleted_at is not null as deleted from public.transactions order by display_no;

-- 入金済みに変更
update public.transactions set deposit_status='paid', deposit_date='2026-10-25', deleted_at=null where display_no=2;

-- 異常系: すべて失敗するはず
do $$
declare ok int := 0;
begin
  begin insert into public.transactions (type,date,account_id,amount)
        select 'expense','2026-01-01',id,-1 from public.accounts where name='雑費';
  exception when others then ok := ok+1; raise notice 'OK 負の金額を拒否: %', sqlerrm; end;
  begin insert into public.transactions (type,date,account_id,amount)
        select 'expense','2026-01-01',id,100 from public.accounts where name='売上（事業収入）';
  exception when others then ok := ok+1; raise notice 'OK 種別と科目の不一致を拒否: %', sqlerrm; end;
  begin insert into public.transactions (type,date,account_id,amount,deposit_status,deposit_date)
        select 'sales','2026-01-01',id,100,'unpaid','2026-01-02' from public.accounts where name='売上（事業収入）';
  exception when others then ok := ok+1; raise notice 'OK 未入金なのに入金日を拒否: %', sqlerrm; end;
  begin insert into public.transactions (type,date,account_id,amount)
        select 'sales','2026-01-01',id,100 from public.accounts where name='売上（事業収入）';
  exception when others then ok := ok+1; raise notice 'OK 入金状況なしの売上を拒否: %', sqlerrm; end;
  begin insert into public.transactions (display_no,type,date,account_id,amount)
        select 99,'expense','2026-01-01',id,100 from public.accounts where name='雑費';
  exception when others then ok := ok+1; raise notice 'OK IDの手動指定を拒否: %', sqlerrm; end;
  begin delete from public.transactions;
  exception when others then ok := ok+1; raise notice 'OK 完全削除を拒否: %', sqlerrm; end;
  begin insert into public.audit_logs (owner_id,table_name,row_id,action) values (auth.uid(),'x',gen_random_uuid(),'INSERT');
  exception when others then ok := ok+1; raise notice 'OK 履歴の改ざんを拒否: %', sqlerrm; end;
  if ok <> 7 then raise exception '異常系テスト失敗 % / 7', ok; end if;
end $$;

select action, count(*) from public.audit_logs group by action order by action;

-- 別ユーザーからは見えない
set request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222"}';
select count(*) as other_user_sees from public.transactions;
do $$ begin
  update public.transactions set amount = 1;  -- 0行更新になるはず
  if (select count(*) from public.transactions) <> 0 then raise exception 'RLS漏れ'; end if;
end $$;
-- 他人の勘定科目を使った取引は作れない
do $$ begin
  insert into public.transactions (type,date,account_id,amount)
  values ('expense','2026-01-01',(select id from public.accounts limit 1),1);
  raise exception 'RLS漏れ: 他人の科目で登録できた';
exception when others then
  if sqlerrm like 'RLS漏れ%' then raise; end if;
  raise notice 'OK 他人の科目を拒否: %', sqlerrm;
end $$;
-- 未ログイン(anon)は何も見えない
reset role; set role anon;
do $$ begin
  perform count(*) from public.transactions;
  raise exception 'anonが読めた';
exception when insufficient_privilege then raise notice 'OK anonは拒否'; end $$;
reset role;
select 'ALL TESTS PASSED' as result;
