"use client";

import { startTransition, useActionState } from "react";
import { signIn, type LoginState } from "./actions";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, undefined);
  const error = state?.error ?? initialError;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="space-y-4"
    >
      <label className="block">
        <span className="mb-1 block text-sm font-medium">メールアドレス</span>
        <input name="email" type="email" autoComplete="email" required className="field" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">パスワード</span>
        <input name="password" type="password" autoComplete="current-password" required className="field" />
      </label>
      {error && (
        <p role="alert" className="rounded-lg bg-expense-soft px-3 py-2 text-sm text-expense">
          {error}
        </p>
      )}
      <button
        disabled={pending}
        className="w-full rounded-xl bg-brand py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "ログイン中…" : "ログイン"}
      </button>
    </form>
  );
}
