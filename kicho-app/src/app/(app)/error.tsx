"use client";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-line bg-white p-6 text-center">
      <p className="mb-1 font-bold">読み込みに失敗しました</p>
      <p className="mb-4 text-sm text-sub">通信状態を確認して、もう一度お試しください。</p>
      <button onClick={reset} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">
        再読み込み
      </button>
    </div>
  );
}
