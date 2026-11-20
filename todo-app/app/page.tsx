import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** 첫 화면 (서버 컴포넌트). 로그인한 사용자는 바로 할 일 목록으로 보낸다. */
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/todos");
  }

  return (
    <section className="intro" aria-labelledby="intro-heading">
      <h1 id="intro-heading">
        오늘 끝낼 일을
        <br />한 곳에 적어 두세요
      </h1>
      <p>
        할 일을 추가하고, 끝낸 일은 체크하고, 필요한 내용은 메모로 남깁니다. 로그인하면 내가 적은 할 일만
        보입니다.
      </p>
      <div className="intro-actions">
        <Link href="/signup" className="button button-primary">
          회원가입
        </Link>
        <Link href="/login" className="button">
          로그인
        </Link>
      </div>
    </section>
  );
}
