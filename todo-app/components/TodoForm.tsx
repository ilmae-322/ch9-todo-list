"use client";

import { useState, type FormEvent } from "react";

interface TodoFormProps {
  /** 추가에 성공하면 true를 반환한다. */
  onAdd: (title: string) => Promise<boolean>;
}

const MAX_TITLE_LENGTH = 100;

/** 새 할 일을 입력받는 폼. 입력값과 제출 중 상태만 관리한다. */
export default function TodoForm({ onAdd }: TodoFormProps) {
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = title.trim();
    if (!trimmed) {
      setMessage("할 일을 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    const succeeded = await onAdd(trimmed);
    setIsSubmitting(false);

    if (succeeded) {
      setTitle("");
    }
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="new-todo" className="visually-hidden">
        새 할 일
      </label>
      <input
        id="new-todo"
        type="text"
        value={title}
        onChange={(event) => {
          setTitle(event.target.value);
          if (message) setMessage(null);
        }}
        placeholder="할 일을 입력하세요"
        maxLength={MAX_TITLE_LENGTH}
        autoComplete="off"
        aria-invalid={message ? true : undefined}
        aria-describedby={message ? "new-todo-message" : undefined}
      />
      <button type="submit" className="button button-primary" disabled={isSubmitting}>
        {isSubmitting ? "추가하는 중" : "추가"}
      </button>
      {message && (
        <p id="new-todo-message" className="field-message" role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
