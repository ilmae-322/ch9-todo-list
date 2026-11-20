import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import MemoEditor from "@/components/MemoEditor";
import { createClient } from "@/lib/supabase/server";
import { TODO_COLUMNS, type Todo } from "@/types/todo";

interface TodoDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "할 일 상세" };

/**
 * 할 일 상세 페이지 (서버 컴포넌트, 동적 라우트 /todos/[id]).
 * 화면 대부분이 읽기 전용이므로 서버에서 조회해 완성된 HTML을 내려보내고,
 * 입력이 필요한 메모 편집기만 클라이언트 컴포넌트로 분리했다.
 */
export default async function TodoDetailPage({ params }: TodoDetailPageProps) {
  const { id } = await params;

  // 동적 라우트 파라미터 검증: 숫자가 아닌 값(/todos/abc)은 조회하지 않고 404로 처리한다.
  if (!/^\d{1,15}$/.test(id)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // RLS 정책에 의해 본인의 할 일만 조회된다. 다른 회원의 id를 넣으면 결과가 없다.
  const { data: todo, error } = await supabase
    .from("todos")
    .select(TODO_COLUMNS)
    .eq("id", Number(id))
    .maybeSingle<Todo>();

  if (error) {
    // 가까운 error.tsx가 오류 화면을 보여준다.
    throw new Error("할 일을 불러오지 못했습니다.");
  }
  if (!todo) {
    notFound();
  }

  const createdAt = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(todo.created_at));

  return (
    <article className="detail" aria-labelledby="detail-heading">
      <Link href="/todos" className="back-link">
        목록으로 돌아가기
      </Link>

      <h1 id="detail-heading">{todo.title}</h1>

      <dl className="detail-meta">
        <div>
          <dt>상태</dt>
          <dd>
            <span className={`badge${todo.is_done ? " badge-done" : ""}`}>
              {todo.is_done ? "완료" : "진행 중"}
            </span>
          </dd>
        </div>
        <div>
          <dt>작성일</dt>
          <dd>
            <time dateTime={todo.created_at}>{createdAt}</time>
          </dd>
        </div>
      </dl>

      {/* key: 다른 할 일로 이동하면 편집기의 입력 상태를 초기화한다. */}
      <MemoEditor key={todo.id} todoId={todo.id} initialMemo={todo.memo ?? ""} />
    </article>
  );
}
