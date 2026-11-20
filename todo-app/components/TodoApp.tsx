"use client";

import { useCallback } from "react";
import StatusMessage from "@/components/StatusMessage";
import TodoForm from "@/components/TodoForm";
import TodoList from "@/components/TodoList";
import { useTodos } from "@/hooks/useTodos";

interface TodoAppProps {
  /** 서버에서 계산해 전달한 오늘 날짜 문구 (서버와 브라우저의 시간대 차이로 화면이 어긋나지 않게 한다) */
  todayLabel: string;
}

/**
 * 할 일 화면의 컨테이너. 상태와 데이터 연동은 useTodos 훅에 맡기고,
 * 여기서는 상태(로딩, 오류, 빈 데이터, 목록)에 따라 무엇을 보여줄지만 결정한다.
 */
export default function TodoApp({ todayLabel }: TodoAppProps) {
  const { todos, isLoading, loadError, actionError, reload, addTodo, updateTodo, deleteTodo } =
    useTodos();

  // 자식에게 넘기는 함수의 참조를 유지해 memo된 TodoItem이 불필요하게 다시 렌더링되지 않게 한다.
  const handleToggle = useCallback(
    (id: number, isDone: boolean) => updateTodo(id, { is_done: isDone }),
    [updateTodo],
  );
  const handleRename = useCallback(
    (id: number, title: string) => updateTodo(id, { title }),
    [updateTodo],
  );

  const doneCount = todos.filter((todo) => todo.is_done).length;
  const progress = todos.length === 0 ? 0 : Math.round((doneCount / todos.length) * 100);

  return (
    <section aria-labelledby="today-heading">
      <header className="today">
        <h1 id="today-heading">{todayLabel}</h1>
        {!isLoading && !loadError && todos.length > 0 && (
          <>
            <p className="today-summary">
              {todos.length}개 중 {doneCount}개를 끝냈어요
            </p>
            <div
              className="progress"
              role="progressbar"
              aria-label="완료한 할 일 비율"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
          </>
        )}
      </header>

      <TodoForm onAdd={addTodo} />

      {actionError && (
        <p className="field-message" role="alert">
          {actionError}
        </p>
      )}

      {/* 상태별 UI: 로딩 → 오류 → 빈 데이터 → 목록 순서로 판단한다. */}
      {isLoading ? (
        <StatusMessage tone="info" title="할 일을 불러오는 중입니다" />
      ) : loadError ? (
        <StatusMessage tone="error" title="불러오기에 실패했습니다" description={loadError}>
          <button type="button" className="button button-primary" onClick={reload}>
            다시 시도
          </button>
        </StatusMessage>
      ) : todos.length === 0 ? (
        <StatusMessage
          tone="empty"
          title="아직 할 일이 없습니다"
          description="위 입력창에 오늘 할 일을 적고 추가해 보세요."
        />
      ) : (
        <TodoList
          todos={todos}
          onToggle={handleToggle}
          onRename={handleRename}
          onDelete={deleteTodo}
        />
      )}
    </section>
  );
}
