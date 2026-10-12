import Link from "next/link";
import { BottomNav, SideNav } from "@/components/Nav";
import { Icon } from "@/components/Icon";
import { signOut } from "@/app/login/actions";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:flex">
      <aside className="sticky top-0 hidden h-dvh w-52 shrink-0 flex-col border-r border-line bg-white px-4 py-5 md:flex">
        <Link href="/" className="mb-6 flex items-center gap-2 px-1 text-lg font-bold tracking-wide">
          <img src="/icon.svg" alt="" className="size-7" />
          記帳
        </Link>
        <SideNav />
        <form action={signOut} className="mt-auto">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-mute hover:bg-black/[0.04]">
            <Icon name="logout" />
            ログアウト
          </button>
        </form>
      </aside>
      <main className="min-w-0 flex-1 px-4 pt-4 pb-28 md:px-6 md:pt-8 md:pb-12">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
