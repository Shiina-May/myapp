"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";

type Item = { href: string; label: string; icon: IconName };

const SIDE: Item[] = [
  { href: "/", label: "ダッシュボード", icon: "home" },
  { href: "/transactions", label: "取引", icon: "list" },
  { href: "/sales", label: "売上・入金", icon: "yen" },
  { href: "/reports", label: "集計", icon: "chart" },
  { href: "/settings", label: "設定", icon: "gear" },
];

const BOTTOM: Item[] = [
  { href: "/", label: "ホーム", icon: "home" },
  { href: "/transactions", label: "取引", icon: "list" },
  { href: "/capture", label: "撮影", icon: "camera" },
  { href: "/sales", label: "売上", icon: "yen" },
  { href: "/more", label: "その他", icon: "more" },
];

function isActive(path: string, href: string) {
  if (href === "/") return path === "/";
  return path === href || path.startsWith(href + "/");
}

export function SideNav() {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      <Link
        href="/capture"
        className="mb-2 flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 font-semibold text-white shadow-sm hover:bg-brand-dark"
      >
        <Icon name="camera" />
        レシート撮影
      </Link>
      <Link
        href="/transactions/new"
        className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-brand px-4 py-2.5 font-semibold text-brand hover:bg-brand-soft"
      >
        <Icon name="plus" />
        取引を追加
      </Link>
      {SIDE.map((it) => {
        const active = isActive(path, it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] ${
              active ? "bg-brand-soft font-semibold text-brand-dark" : "text-sub hover:bg-black/[0.04]"
            }`}
          >
            <Icon name={it.icon} />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  const path = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {BOTTOM.map((it) => {
          const active = isActive(path, it.href);
          if (it.href === "/capture") {
            return (
              <li key={it.href} className="flex justify-center">
                <Link
                  href={it.href}
                  aria-label="レシート撮影"
                  className="-mt-5 flex size-14 flex-col items-center justify-center rounded-full bg-brand text-white shadow-lg ring-4 ring-paper active:scale-95"
                >
                  <Icon name="camera" className="size-6" />
                </Link>
              </li>
            );
          }
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${
                  active ? "font-semibold text-brand" : "text-mute"
                }`}
              >
                <Icon name={it.icon} className="size-6" />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
