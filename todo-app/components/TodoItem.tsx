"use client";

import { memo, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import type { Todo } from "@/types/todo";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number, isDone: boolean) => Promise<boolean>;
  onRename: (id: number, title: string) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
}

/**
 * 할 일 한 건. 완료 체크, 제목 수정, 삭제를 처리한다.
 * memo로 감싸 다른 항목이 바뀔 때는 다시 렌더링하지 않는다.
 */
function TodoItem({ todo, onToggle, onRename, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);
  const [isBusy, setIsBusy] = useState(false);

  function startEditing() {
    setDraft(todo.title);
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraft(todo.title);
    setIsEditing(false);
  }

  async function saveTitle() {
    const trimmed = draft.trim();
    // 내용을 모두 지웠거나 바뀐 것이 없으면 원래 제목을 유지한다.
    if (!trimmed || trimmed === todo.title) {
      cancelEditing();
      return;
    }

    setIsBusy(true);
    const succeeded = await onRename(todo.id, trimmed);
    setIsBusy(false);
    if (succeeded) setIsEditing(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      saveTitle();
    } else if (event.key === "Escape") {
      cancelEditing();
    }
  }

  async function handleToggle() {
    setIsBusy(true);
    await onToggle(todo.id, !todo.is_done);
    setIsBusy(false);
  }

  async function handleDelete() {
    setIsBusy(true);
    const succeeded = await onDelete(todo.id);
    // 삭제에 성공하면 이 컴포넌트는 사라지므로 실패했을 때만 상태를 되돌린다.
    if (!succeeded) setIsBusy(false);
  }

  return (
    <li className={`todo-item${todo.is_done ? " is-done" : ""}`}>
      <input
        type="checkbox"
        className="todo-check"
        checked={todo.is_done}
        onChange={handleToggle}
        disabled={isBusy}
        aria-label={`${todo.title} 완료 표시`}
      />

      {isEditing ? (
        <>
          <label htmlFor={`todo-title-${todo.id}`} className="visually-hidden">
            할 일 제목 수정
          </label>
          <input
            id={`todo-title-${todo.id}`}
            type="text"
            className="todo-edit-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={100}
            disabled={isBusy}
            autoFocus
          />
          <div className="todo-actions">
            <button type="button" className="button button-primary" onClick={saveTitle} disabled={isBusy}>
              저장
            </button>
            <button type="button" className="button" onClick={cancelEditing} disabled={isBusy}>
              취소
            </button>
          </div>
        </>
      ) : (
        <>
          <Link href={`/todos/${todo.id}`} className="todo-title">
            {todo.title}
          </Link>
          <div className="todo-actions">
            <button type="button" className="button" onClick={startEditing} disabled={isBusy}>
              수정
            </button>
            <button type="button" className="button button-danger" onClick={handleDelete} disabled={isBusy}>
              삭제
            </button>
          </div>
        </>
      )}
    </li>
  );
}

export default memo(TodoItem);
