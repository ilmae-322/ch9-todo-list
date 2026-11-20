import Link from "next/link";
import StatusMessage from "@/components/StatusMessage";

export default function NotFound() {
  return (
    <StatusMessage tone="empty" title="페이지를 찾을 수 없습니다" description="주소를 다시 확인해 주세요.">
      <Link href="/" className="button button-primary">
        처음으로 돌아가기
      </Link>
    </StatusMessage>
  );
}
