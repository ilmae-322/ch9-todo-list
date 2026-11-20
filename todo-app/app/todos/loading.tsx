import StatusMessage from "@/components/StatusMessage";

/** /todos 이하 페이지로 이동하는 동안 보여주는 화면 */
export default function Loading() {
  return <StatusMessage tone="info" title="페이지를 불러오는 중입니다" />;
}
