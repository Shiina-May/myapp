import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { signOut } from "@/app/login/actions";

const ITEMS: { href: string; label: string; icon: IconName; note?: string }[] = [
  { href: "/transactions/new", label: "取引を手入力", icon: "plus" },
  { href: "/reports", label: "集計", icon: "chart", note: "Phase 2" },
  { href: "/transactions/trash", label: "ゴミ箱", icon: "trash" },
  { href: "/settings", label: "設定（勘定科目・支払方法）", icon: "gear" },
];

export default function MorePage() {
  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="その他" />
      <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
        {ITEMS.map((it) => (
          <li key={it.href}>
            <Link href={it.href} className="flex items-center gap-3 px-4 py-3.5">
              <Icon name={it.icon} className="size-5 text-sub" />
              <span className="flex-1">{it.label}</span>
              {it.note && <span className="text-xs text-mute">{it.note}</span>}
            </Link>
          </li>
        ))}
      </ul>
      <form action={signOut} className="mt-6">
        <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white py-3 text-sub">
          <Icon name="logout" />
          ログアウト
        </button>
      </form>
    </div>
  );
}
