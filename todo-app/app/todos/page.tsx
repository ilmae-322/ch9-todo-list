import type { Metadata } from "next";
import { redirect } from "next/navigation";
import TodoApp from "@/components/TodoApp";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "할 일 목록" };

/**
 * 할 일 목록 페이지 (서버 컴포넌트).
 * - 서버에서 로그인 여부를 한 번 더 확인한다. (proxy.ts에 이은 2차 확인)
 * - 추가, 수정, 삭제 결과를 즉시 반영해야 하는 목록은 클라이언트 컴포넌트(TodoApp)에 맡긴다.
 */
export default async function TodosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const todayLabel = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());

  return <TodoApp todayLabel={todayLabel} />;
}
