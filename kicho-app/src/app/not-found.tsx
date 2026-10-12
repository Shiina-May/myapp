import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-lg font-bold">ページが見つかりません</p>
      <p className="text-sm text-sub">削除された取引か、URLが間違っている可能性があります。</p>
      <Link href="/transactions" className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">
        取引一覧へ
      </Link>
    </main>
  );
}
