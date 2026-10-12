import { ComingSoon, PageHeader } from "@/components/PageHeader";

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="集計" />
      <ComingSoon phase="Phase 2">1〜12月の月次集計、勘定科目別経費、取引先別売上をここに表示します。</ComingSoon>
    </div>
  );
}
