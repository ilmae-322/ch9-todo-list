import Link from "next/link";
import StatusMessage from "@/components/StatusMessage";

/** 없는 id, 형식이 잘못된 id, 다른 회원의 할 일에 접근했을 때 보여주는 화면 */
export default function TodoNotFound() {
  return (
    <StatusMessage
      tone="empty"
      title="할 일을 찾을 수 없습니다"
      description="삭제되었거나 주소가 잘못되었습니다."
    >
      <Link href="/todos" className="button button-primary">
        목록으로 돌아가기
      </Link>
    </StatusMessage>
  );
}
