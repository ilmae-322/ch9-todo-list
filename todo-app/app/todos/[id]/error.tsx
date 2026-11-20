"use client";

import Link from "next/link";
import StatusMessage from "@/components/StatusMessage";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** 상세 페이지를 그리다 오류가 났을 때 보여주는 화면. error 파일은 클라이언트 컴포넌트여야 한다. */
export default function TodoDetailError({ reset }: ErrorPageProps) {
  return (
    <StatusMessage
      tone="error"
      title="할 일을 불러오지 못했습니다"
      description="네트워크 상태를 확인한 뒤 다시 시도해 주세요."
    >
      <div className="status-actions">
        <button type="button" className="button button-primary" onClick={reset}>
          다시 시도
        </button>
        <Link href="/todos" className="button">
          목록으로 돌아가기
        </Link>
      </div>
    </StatusMessage>
  );
}
