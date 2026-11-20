import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** 로그인해야 볼 수 있는 경로 */
const PROTECTED_PREFIXES = ["/todos"];
/** 로그인한 사용자는 다시 볼 필요가 없는 경로 */
const AUTH_PAGES = ["/login", "/signup"];

/**
 * 모든 요청에서 Supabase 세션(쿠키)을 갱신하고, 로그인 여부에 따라 접근을 제어한다.
 * - 미인증 사용자가 /todos 이하에 접근하면 /login으로 보낸다.
 * - 로그인한 사용자가 /login, /signup에 접근하면 /todos로 보낸다.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser()는 토큰을 Supabase 서버에서 검증한다. (쿠키 값만 믿지 않는다)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (!user && isProtected) {
    return redirectTo(request, response, "/login");
  }
  if (user && isAuthPage) {
    return redirectTo(request, response, "/todos");
  }
  return response;
}

/** 갱신된 세션 쿠키를 유지한 채로 리디렉션한다. */
function redirectTo(request: NextRequest, response: NextResponse, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  const redirectResponse = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
  return redirectResponse;
}
