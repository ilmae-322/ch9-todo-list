import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import { createClient } from "@/lib/supabase/server";

/**
 * 사이트 공통 헤더 (서버 컴포넌트).
 * 로그인 여부와 닉네임을 서버에서 조회해 완성된 HTML로 내려보낸다.
 */
export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let nickname: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("id", user.id)
      .maybeSingle<{ nickname: string }>();
    nickname = profile?.nickname ?? user.email ?? null;
  }

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link href={user ? "/todos" : "/"} className="brand">
          오늘 할 일
        </Link>

        <nav aria-label="계정">
          {user ? (
            <ul className="nav-list">
              <li className="nav-user">{nickname} 님</li>
              <li>
                <SignOutButton />
              </li>
            </ul>
          ) : (
            <ul className="nav-list">
              <li>
                <Link href="/login">로그인</Link>
              </li>
              <li>
                <Link href="/signup" className="button button-primary">
                  회원가입
                </Link>
              </li>
            </ul>
          )}
        </nav>
      </div>
    </header>
  );
}
