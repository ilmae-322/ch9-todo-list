"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TODO_COLUMNS, type Todo, type TodoChanges } from "@/types/todo";

interface UseTodosResult {
  todos: Todo[];
  isLoading: boolean;
  /** 목록 조회 실패 메시지 (없으면 null) */
  loadError: string | null;
  /** 추가·수정·삭제 실패 메시지 (없으면 null) */
  actionError: string | null;
  reload: () => void;
  addTodo: (title: string) => Promise<boolean>;
  updateTodo: (id: number, changes: TodoChanges) => Promise<boolean>;
  deleteTodo: (id: number) => Promise<boolean>;
}

const LOAD_ERROR = "할 일을 불러오지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.";

/**
 * 할 일 목록의 상태와 Supabase 연동을 담당하는 커스텀 훅.
 * 화면 컴포넌트는 이 훅이 주는 값과 함수만 사용하고, 데이터 접근 방법은 알 필요가 없다.
 */
export function useTodos(): UseTodosResult {
  const router = useRouter();
  // 클라이언트를 한 번만 만들어 렌더링마다 같은 객체를 쓴다. (effect 의존성이 바뀌지 않는다)
  const [supabase] = useState(() => createClient());

  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  // 값이 바뀌면 목록을 다시 불러온다. ("다시 시도" 버튼용)
  const [reloadKey, setReloadKey] = useState(0);

  // 1) 목록 조회: 처음 화면에 나타날 때와 reloadKey가 바뀔 때 실행
  useEffect(() => {
    // 응답이 오기 전에 컴포넌트가 사라지거나 재요청되면, 늦게 도착한 응답은 버린다.
    let ignore = false;

    async function load() {
      const { data, error } = await supabase
        .from("todos")
        .select(TODO_COLUMNS)
        .order("created_at", { ascending: false })
        .returns<Todo[]>();

      if (ignore) return;

      if (error) {
        setLoadError(LOAD_ERROR);
      } else {
        setTodos(data ?? []);
        setLoadError(null);
      }
      setIsLoading(false);
    }

    load();

    return () => {
      ignore = true;
    };
  }, [supabase, reloadKey]);

  // 2) 인증 상태 구독: 다른 탭에서 로그아웃하거나 세션이 만료되면 로그인 화면으로 보낸다.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/login");
        // 서버 컴포넌트(헤더)도 로그아웃 상태를 반영하도록 새로고침한다.
        router.refresh();
      }
    });

    // 클린업: 컴포넌트가 사라질 때 구독을 해제한다.
    return () => subscription.unsubscribe();
  }, [supabase, router]);

  const reload = useCallback(() => {
    setIsLoading(true);
    setLoadError(null);
    setReloadKey((key) => key + 1);
  }, []);

  const addTodo = useCallback(
    async (title: string) => {
      const { data, error } = await supabase
        .from("todos")
        .insert({ title })
        .select(TODO_COLUMNS)
        .single<Todo>();

      if (error || !data) {
        setActionError("할 일을 추가하지 못했습니다. 다시 시도해 주세요.");
        return false;
      }
      setTodos((current) => [data, ...current]);
      setActionError(null);
      return true;
    },
    [supabase],
  );

  const updateTodo = useCallback(
    async (id: number, changes: TodoChanges) => {
      const { data, error } = await supabase
        .from("todos")
        .update(changes)
        .eq("id", id)
        .select(TODO_COLUMNS)
        .single<Todo>();

      if (error || !data) {
        setActionError("변경 내용을 저장하지 못했습니다. 다시 시도해 주세요.");
        return false;
      }
      setTodos((current) => current.map((todo) => (todo.id === id ? data : todo)));
      setActionError(null);
      return true;
    },
    [supabase],
  );

  const deleteTodo = useCallback(
    async (id: number) => {
      const { error } = await supabase.from("todos").delete().eq("id", id);

      if (error) {
        setActionError("할 일을 삭제하지 못했습니다. 다시 시도해 주세요.");
        return false;
      }
      setTodos((current) => current.filter((todo) => todo.id !== id));
      setActionError(null);
      return true;
    },
    [supabase],
  );

  return { todos, isLoading, loadError, actionError, reload, addTodo, updateTodo, deleteTodo };
}
