"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface AuthFormProps {
  mode: "login" | "signup";
}

const COPY = {
  login: {
    heading: "로그인",
    submit: "로그인",
    submitting: "로그인하는 중",
    switchText: "아직 계정이 없나요?",
    switchLink: "회원가입",
    switchHref: "/signup",
  },
  signup: {
    heading: "회원가입",
    submit: "가입하기",
    submitting: "가입하는 중",
    switchText: "이미 계정이 있나요?",
    switchLink: "로그인",
    switchHref: "/login",
  },
} as const;

/** Supabase가 돌려준 오류를 사용자가 이해할 수 있는 문장으로 바꾼다. */
function toMessage(errorMessage: string): string {
  if (errorMessage.includes("Invalid login credentials")) {
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  }
  if (errorMessage.includes("already registered")) {
    return "이미 가입된 이메일입니다. 로그인해 주세요.";
  }
  if (errorMessage.includes("Email not confirmed")) {
    return "이메일 인증이 완료되지 않았습니다. 받은 메일의 링크를 눌러 주세요.";
  }
  if (errorMessage.includes("Password should be")) {
    return "비밀번호는 6자 이상이어야 합니다.";
  }
  return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

/** 로그인과 회원가입에 함께 쓰는 폼. mode에 따라 문구와 동작이 달라진다. */
export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const copy = COPY[mode];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!email.trim() || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    if (mode === "signup") {
      if (!nickname.trim()) {
        setError("닉네임을 입력해 주세요.");
        return;
      }
      if (password.length < 6) {
        setError("비밀번호는 6자 이상이어야 합니다.");
        return;
      }
    }

    setIsSubmitting(true);
    const supabase = createClient();

    if (mode === "login") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(toMessage(signInError.message));
        setIsSubmitting(false);
        return;
      }
    } else {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { nickname: nickname.trim() } },
      });
      if (signUpError) {
        setError(toMessage(signUpError.message));
        setIsSubmitting(false);
        return;
      }
      // 이메일 인증을 사용하는 프로젝트에서는 가입 직후 세션이 없다.
      if (!data.session) {
        setNotice("인증 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인해 주세요.");
        setIsSubmitting(false);
        return;
      }
    }

    // 서버 컴포넌트(헤더 등)가 새 세션을 반영하도록 새로고침한 뒤 이동한다.
    router.replace("/todos");
    router.refresh();
  }

  return (
    <section className="auth" aria-labelledby="auth-heading">
      <h1 id="auth-heading">{copy.heading}</h1>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {mode === "signup" && (
          <div className="field">
            <label htmlFor="nickname">닉네임</label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              maxLength={30}
              autoComplete="nickname"
              required
            />
          </div>
        )}

        <div className="field">
          <label htmlFor="email">이메일</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="password">비밀번호</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={6}
            aria-describedby={mode === "signup" ? "password-hint" : undefined}
            required
          />
          {mode === "signup" && (
            <p id="password-hint" className="field-hint">
              6자 이상 입력해 주세요.
            </p>
          )}
        </div>

        {error && (
          <p className="field-message" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="field-notice" role="status">
            {notice}
          </p>
        )}

        <button type="submit" className="button button-primary button-block" disabled={isSubmitting}>
          {isSubmitting ? copy.submitting : copy.submit}
        </button>
      </form>

      <p className="auth-switch">
        {copy.switchText} <Link href={copy.switchHref}>{copy.switchLink}</Link>
      </p>
    </section>
  );
}
