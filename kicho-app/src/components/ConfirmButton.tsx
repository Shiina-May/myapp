"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "./Icon";

type Props = {
  action: () => Promise<{ ok: boolean }>;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  label: string;
  icon: IconName;
  danger?: boolean;
  className?: string;
  iconOnly?: boolean;
};

/** 確認ダイアログを出してから Server Action を実行するボタン */
export function ConfirmButton({ action, title, message, confirmLabel, label, icon, danger, className, iconOnly }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();

  const run = () =>
    start(async () => {
      const res = await action();
      if (res.ok) {
        ref.current?.close();
        router.refresh();
      } else {
        setError("処理できませんでした。もう一度お試しください。");
      }
    });

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          ref.current?.showModal();
        }}
        className={className ?? "inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-sub hover:bg-black/[0.05]"}
        aria-label={label}
        title={label}
      >
        <Icon name={icon} className="size-4" />
        <span className={iconOnly ? "sr-only" : ""}>{label}</span>
      </button>
      <dialog ref={ref} className="m-auto w-[min(92vw,380px)] rounded-2xl p-0 shadow-xl">
        <div className="p-5">
          <h2 className="mb-2 text-base font-bold">{title}</h2>
          <div className="text-sm text-sub">{message}</div>
          {error && <p className="mt-3 text-sm text-expense">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-line bg-paper px-5 py-3">
          <button type="button" onClick={() => ref.current?.close()} className="rounded-lg px-4 py-2 text-sm text-sub hover:bg-black/[0.05]">
            キャンセル
          </button>
          <button
            type="button"
            onClick={run}
            disabled={pending}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
              danger ? "bg-expense hover:opacity-90" : "bg-brand hover:bg-brand-dark"
            }`}
          >
            {pending ? "処理中…" : confirmLabel}
          </button>
        </div>
      </dialog>
    </>
  );
}
