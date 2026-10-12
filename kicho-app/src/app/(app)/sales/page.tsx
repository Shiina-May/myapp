import Link from "next/link";
import { ComingSoon, PageHeader } from "@/components/PageHeader";

export default function SalesPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="売上・入金" />
      <ComingSoon phase="Phase 2">
        取引先・売上日・入金日・入金状況の一覧と「入金済みにする」操作をここに作ります。
        <br />
        売上の登録・入金状況の変更は、今は{" "}
        <Link href="/transactions?type=sales" className="font-semibold text-brand underline">
          取引一覧
        </Link>{" "}
        から行えます。
      </ComingSoon>
    </div>
  );
}
