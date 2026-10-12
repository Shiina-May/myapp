import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAllowedEmail, supabaseEnv } from "@/lib/supabase/env";

const PUBLIC_PATHS = ["/login"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = supabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // ログイン状態の確認（JWT を検証する getClaims を使う）
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email as string | undefined;
  const loggedIn = !!data?.claims?.sub;
  const path = request.nextUrl.pathname;

  // リダイレクトする場合も、更新された cookie（ログアウト等）を引き継ぐ
  const redirectTo = (pathname: string, search = "") => {
    const to = request.nextUrl.clone();
    to.pathname = pathname;
    to.search = search;
    const res = NextResponse.redirect(to);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));

  // 許可されていないメールアドレスは強制ログアウト
  if (loggedIn && !isAllowedEmail(email)) {
    await supabase.auth.signOut();
    return redirectTo("/login", "?error=forbidden");
  }

  if (!loggedIn && !isPublic) return redirectTo("/login");
  if (loggedIn && isPublic) return redirectTo("/");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|.*\\.(?:png|jpg|svg|webp)$).*)"],
};
