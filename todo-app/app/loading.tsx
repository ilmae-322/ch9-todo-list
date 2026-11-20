import StatusMessage from "@/components/StatusMessage";

/** 페이지가 준비되는 동안 보여주는 화면 */
export default function Loading() {
  return <StatusMessage tone="info" title="페이지를 불러오는 중입니다" />;
}
