import type { Metadata, Viewport } from "next";
import { Suspense, type ReactNode } from "react";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "오늘 할 일",
    template: "%s | 오늘 할 일",
  },
  description: "로그인한 회원만 쓰는 나만의 할 일 목록",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

/** 헤더가 준비되기 전에 보여주는 자리 표시. 높이를 맞춰 화면이 밀리지 않게 한다. */
function HeaderFallback() {
  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <span className="brand">오늘 할 일</span>
      </div>
    </header>
  );
}

/** 모든 페이지가 공유하는 틀 (서버 컴포넌트) */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {/* 헤더는 로그인 정보를 조회하므로, 준비되는 동안 빈 헤더를 먼저 보여주고 완성되면 교체한다(스트리밍). */}
        <Suspense fallback={<HeaderFallback />}>
          <Header />
        </Suspense>
        <main className="container main">{children}</main>
      </body>
    </html>
  );
}
