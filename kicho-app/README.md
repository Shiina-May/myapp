# 記帳アプリ（個人用）

レシート撮影・日々の記帳・売上/入金管理・月次/年次集計を行う個人用Webアプリです。
確定申告はやよいで行い、このアプリは「記帳」と「売上推移の確認」を担当します。

- フロント/サーバー: Next.js 15（TypeScript）
- DB・認証・画像保存: Supabase（PostgreSQL / Auth / Storage）
- ホスティング: Vercel

> 会計データ・レシート画像・APIキーはGitHubに保存しません（`.gitignore` で除外済み）。

---

## 初回セットアップ（1回だけ）

### 1. Supabase
1. https://supabase.com で New project（Region: **Northeast Asia (Tokyo)**）
2. 左メニュー **SQL Editor** → New query →
   `supabase/migrations/20261012000001_init.sql` の中身を全部貼り付けて **Run**
3. **Authentication → Sign In / Providers**
   - 「Allow new users to sign up」を **OFF**（自分以外が登録できないようにする）
   - Email プロバイダは ON のまま
4. **Authentication → Users → Add user → Create new user**
   - 自分のメールアドレスとパスワードを入力、「Auto Confirm User」に ✓
5. **Project Settings → API Keys** で次の2つを控える
   - Project URL（`https://xxxx.supabase.co`）
   - Publishable key（`sb_publishable_...`）※ 表示がなければ anon key

### 2. GitHub
Private リポジトリ（例：`kicho-app`）を作り、このフォルダの中身をpushします。
```bash
git init
git add .
git commit -m "Phase 1: 認証・DB・取引の追加/編集/削除"
git branch -M main
git remote add origin https://github.com/<ユーザー名>/kicho-app.git
git push -u origin main
```

### 3. Vercel
1. https://vercel.com → Add New → Project → GitHubの `kicho-app` を Import
2. **Environment Variables** に3つ登録
   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | SupabaseのProject URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key |
   | `ALLOWED_EMAIL` | 手順1-4で作ったメールアドレス |
3. **Deploy** → 表示されたURLを開いてログイン
4. スマホでURLを開き「ホーム画面に追加」するとアプリのように使えます

以後は GitHub に push するたびに Vercel が自動で更新します。

---

## 自分のPCで動かす場合（任意）
```bash
npm install
cp .env.example .env.local   # 値を記入
npm run dev                  # http://localhost:3000
```

## フォルダ構成
```
src/
  app/
    login/                 ログイン
    (app)/                 ログイン後の画面（ナビ付き）
      page.tsx             ダッシュボード
      transactions/        取引一覧・追加・編集・ゴミ箱・保存処理
      settings/            勘定科目・支払方法
      sales/ reports/ capture/ more/
  components/              フォーム・ナビ・ダイアログなど
  lib/                     Supabase接続・入力チェック・表示用の関数
  middleware.ts            ログイン確認（未ログイン・許可外アドレスを遮断）
supabase/
  migrations/              DBの構造（Supabaseで実行するSQL）
  tests/                   DBのテスト（ローカル検証用）
```

## データの守り方
- RLS（行単位のアクセス制御）で、ログインした本人以外はデータを読めない/書けない
- 取引は完全削除できない（ゴミ箱＝論理削除のみ）。帳簿の7年保存に対応
- 取引の追加・変更はすべて `audit_logs` に自動記録（アプリからは改ざん不可）
- 取引ID（T-000001…）はDBのシーケンスで発行。削除しても再利用されない
