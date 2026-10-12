"use client";

import { useRouter } from "next/navigation";
import { Icon } from "./Icon";

type Props = {
  years: number[];
  year: number;
  month: number | null;
  type: string;
  q: string;
};

export function FilterBar({ years, year, month, type, q }: Props) {
  const router = useRouter();

  const submit = (form: HTMLFormElement) => {
    const fd = new FormData(form);
    const params = new URLSearchParams();
    for (const [k, v] of fd.entries()) if (String(v).trim()) params.set(k, String(v).trim());
    router.push(`/transactions?${params.toString()}`);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(e.currentTarget);
      }}
      onChange={(e) => {
        if ((e.target as HTMLElement).tagName === "SELECT") submit(e.currentTarget);
      }}
      className="mb-4 grid grid-cols-3 gap-2 md:flex md:flex-wrap md:items-center"
    >
      <select name="year" defaultValue={year} className="field md:w-28" aria-label="年">
        {years.map((y) => (
          <option key={y} value={y}>
            {y}年
          </option>
        ))}
      </select>
      <select name="month" defaultValue={month ?? ""} className="field md:w-28" aria-label="月">
        <option value="">全月</option>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <option key={m} value={m}>
            {m}月
          </option>
        ))}
      </select>
      <select name="type" defaultValue={type} className="field md:w-32" aria-label="種別">
        <option value="">すべて</option>
        <option value="expense">経費のみ</option>
        <option value="sales">売上のみ</option>
      </select>
      <div className="relative col-span-3 md:w-80">
        <input
          name="q"
          defaultValue={q}
          placeholder="ID・支払先・内容・備考で検索"
          className="field pl-9"
          aria-label="キーワード"
          enterKeyHint="search"
        />
        <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-mute" />
      </div>
    </form>
  );
}
