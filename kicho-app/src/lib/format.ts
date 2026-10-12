const yenFmt = new Intl.NumberFormat("ja-JP");

export function yen(n: number) {
  return `${yenFmt.format(n)}円`;
}

/** 表示用の取引ID（例: T-000123） */
export function displayId(no: number) {
  return `T-${String(no).padStart(6, "0")}`;
}

/** "T-000123" / "t123" / "123" → 123。IDとして解釈できなければ null */
export function parseDisplayId(input: string): number | null {
  const m = input.trim().match(/^(?:t-?)?0*(\d{1,12})$/i);
  return m ? Number(m[1]) : null;
}

/** 日本時間の今日（YYYY-MM-DD） */
export function todayJST() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());
}

export function currentYearJST() {
  return Number(todayJST().slice(0, 4));
}

/** 2026-01-05 → 2026/01/05 */
export function slashDate(d: string | null | undefined) {
  return d ? d.replaceAll("-", "/") : "";
}
