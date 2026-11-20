"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** 로그아웃 버튼이다. 클릭 이벤트가 필요해 클라이언트 컴포넌트로 분리했다. */
export default function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button type="button" className="button" onClick={handleSignOut} disabled={isSigningOut}>
      {isSigningOut ? "로그아웃하는 중" : "로그아웃"}
    </button>
  );
}
