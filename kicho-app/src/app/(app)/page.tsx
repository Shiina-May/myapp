import Link from "next/link";
import { ComingSoon, PageHeader } from "@/components/PageHeader";
import { currentYearJST } from "@/lib/format";

export default function DashboardPage() {
  const year = currentYearJST();
  return (
    <div>
      <PageHeader title={`${year}年`} sub="ダッシュボード" />
      <div className="mb-6 grid gap-3 md:grid-cols-2">
        <Link href="/capture" className="rounded-2xl bg-brand p-5 text-white shadow-sm hover:bg-brand-dark">
          <p className="text-lg font-bold">レシートを撮影</p>
          <p className="text-sm opacity-80">撮るだけで記帳（Phase 3で有効になります）</p>
        </Link>
        <Link href="/transactions/new" className="rounded-2xl border border-line bg-white p-5 hover:border-brand">
          <p className="text-lg font-bold">取引を手入力</p>
          <p className="text-sm text-sub">売上・レシートのない経費</p>
        </Link>
      </div>
      <ComingSoon phase="Phase 2">
        年間・今月の売上／経費／利益、月別グラフ、取引先別売上、未入金一覧をここに表示します。
      </ComingSoon>
    </div>
  );
}
