"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface MemoEditorProps {
  todoId: number;
  initialMemo: string;
}

const MAX_MEMO_LENGTH = 1000;

/** 상세 페이지의 메모 편집기이다. 입력 상태와 저장 이벤트가 필요한 부분만 클라이언트 컴포넌트로 둔다. */
export default function MemoEditor({ todoId, initialMemo }: MemoEditorProps) {
  const router = useRouter();
  const [memo, setMemo] = useState(initialMemo);
  const [savedMemo, setSavedMemo] = useState(initialMemo);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "notice"; text: string } | null>(null);

  const isChanged = memo !== savedMemo;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const normalized = memo.trim();
    const supabase = createClient();
    // RLS로 수정된 행이 없어도 오류가 나지 않으므로, 수정된 행을 돌려받아 확인한다.
    const { data, error } = await supabase
      .from("todos")
      .update({ memo: normalized || null })
      .eq("id", todoId)
      .select("id")
      .maybeSingle();

    setIsSaving(false);

    if (error || !data) {
      setMessage({ tone: "error", text: "메모를 저장하지 못했습니다. 다시 시도해 주세요." });
      return;
    }
    // DB에 저장된 값과 화면 상태를 같게 맞춘다.
    setMemo(normalized);
    setSavedMemo(normalized);
    setMessage({ tone: "notice", text: "메모를 저장했습니다." });
    // 서버 컴포넌트가 가진 데이터도 최신 상태로 맞춘다.
    router.refresh();
  }

  return (
    <form className="memo-form" onSubmit={handleSubmit}>
      <label htmlFor="memo">메모</label>
      <textarea
        id="memo"
        value={memo}
        onChange={(event) => {
          setMemo(event.target.value);
          if (message) setMessage(null);
        }}
        rows={5}
        maxLength={MAX_MEMO_LENGTH}
        placeholder="준비물, 참고할 링크, 마감 시간 등을 적어 두세요"
      />
      <div className="memo-footer">
        <span className="field-hint">
          {memo.length} / {MAX_MEMO_LENGTH}자
        </span>
        <button type="submit" className="button button-primary" disabled={isSaving || !isChanged}>
          {isSaving ? "저장하는 중" : "메모 저장"}
        </button>
      </div>
      {message && (
        <p
          className={message.tone === "error" ? "field-message" : "field-notice"}
          role={message.tone === "error" ? "alert" : "status"}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
