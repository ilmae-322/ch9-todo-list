import type { ReactNode } from "react";

interface StatusMessageProps {
  /** 상태 종류: 안내(loading 포함), 오류, 빈 데이터 */
  tone: "info" | "error" | "empty";
  title: string;
  description?: string;
  /** 다시 시도 버튼 등 추가 동작 */
  children?: ReactNode;
}

/** 로딩, 오류, 빈 데이터 상태를 같은 모양으로 보여주는 공용 컴포넌트 */
export default function StatusMessage({ tone, title, description, children }: StatusMessageProps) {
  return (
    <div
      className={`status status-${tone}`}
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
    >
      <p className="status-title">{title}</p>
      {description && <p className="status-description">{description}</p>}
      {children}
    </div>
  );
}
