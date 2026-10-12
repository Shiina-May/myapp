import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <img src="/icon.svg" alt="" className="size-9" />
          <div>
            <h1 className="text-lg font-bold">記帳</h1>
            <p className="text-xs text-sub">個人用の記帳アプリ</p>
          </div>
        </div>
        <LoginForm initialError={error === "forbidden" ? "このアカウントでは利用できません" : undefined} />
      </div>
    </main>
  );
}
