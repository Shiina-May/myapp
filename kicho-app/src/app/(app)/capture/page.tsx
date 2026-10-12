import Link from "next/link";
import { ComingSoon, PageHeader } from "@/components/PageHeader";

export default function CapturePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="レシート撮影" />
      <ComingSoon phase="Phase 3">
        撮影 → AI解析 → 確認 → 登録 の流れをここに作ります。
        <br />
        それまでは{" "}
        <Link href="/transactions/new" className="font-semibold text-brand underline">
          手入力
        </Link>{" "}
        をお使いください。
      </ComingSoon>
    </div>
  );
}
