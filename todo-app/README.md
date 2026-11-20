# 오늘 할 일 - 회원 전용 Todo 리스트 (Next.js + Supabase)

기존 Todo 리스트를 Next.js(App Router)로 옮기고, Supabase 인증과 데이터베이스를 연동해 로그인한 회원만 자신의 할 일을 관리할 수 있게 만든 프로젝트입니다.

## 배포 주소

| 항목 | 주소 |
|---|---|
| 서비스 (Vercel) | https://<프로젝트>.vercel.app |
| 저장소 | https://github.com/<계정>/<저장소> |

회원가입 후 바로 사용할 수 있습니다.

## 주요 기능

- 회원가입, 로그인, 로그아웃 (Supabase Auth)
- 로그인하지 않은 사용자는 할 일 화면에 접근할 수 없고 로그인 화면으로 이동
- 할 일 추가, 조회, 수정(제목, 완료 여부, 메모), 삭제
- 할 일 상세 페이지 (동적 라우트)
- 로딩, 오류, 빈 데이터, 목록 상태별 화면
- 회원 정보(`profiles`)와 할 일(`todos`)을 Supabase에 저장하고 RLS로 본인 데이터만 접근

## 기술 스택

Next.js 16 (App Router), React 19, TypeScript, Supabase (Auth, PostgreSQL, `@supabase/ssr`), Vercel

## 프로젝트 구조

```
app/
├── layout.tsx              # 공통 틀, 헤더 (서버)
├── page.tsx                # 첫 화면, 로그인 상태면 /todos로 이동 (서버)
├── loading.tsx             # 페이지 전환 중 화면
├── not-found.tsx           # 없는 주소
├── login/page.tsx          # 로그인
├── signup/page.tsx         # 회원가입
└── todos/
    ├── page.tsx            # 할 일 목록 (서버에서 인증 확인 후 TodoApp 렌더링)
    ├── loading.tsx
    └── [id]/
        ├── page.tsx        # 할 일 상세 (서버에서 조회)
        ├── not-found.tsx   # 없는 할 일
        └── error.tsx       # 조회 오류
components/
├── Header.tsx              # 로그인 정보 표시 (서버)
├── SignOutButton.tsx       # 로그아웃 (클라이언트)
├── AuthForm.tsx            # 로그인·회원가입 공용 폼 (클라이언트)
├── TodoApp.tsx             # 목록 화면 컨테이너 (클라이언트)
├── TodoForm.tsx            # 할 일 입력 (클라이언트)
├── TodoList.tsx            # 목록 렌더링
├── TodoItem.tsx            # 할 일 한 건 (클라이언트)
├── MemoEditor.tsx          # 상세 페이지 메모 편집 (클라이언트)
└── StatusMessage.tsx       # 로딩·오류·빈 데이터 공용 표시
hooks/useTodos.ts           # 할 일 상태와 Supabase 연동 (커스텀 훅)
lib/supabase/               # 브라우저용, 서버용, proxy용 Supabase 클라이언트
types/todo.ts               # Todo 타입
proxy.ts                    # 세션 갱신, 미인증 접근 차단
supabase/schema.sql         # 테이블, 트리거, RLS 정책
```

## 컴포넌트 설계와 Props

화면을 기능 단위로 나누고, 부모가 데이터와 처리 함수를 Props로 내려줍니다. 모든 Props는 인터페이스로 타입을 지정했습니다.

```
TodosPage (서버)
└── TodoApp (클라이언트)  ← todayLabel
    ├── TodoForm          ← onAdd
    ├── StatusMessage     ← tone, title, description, children
    └── TodoList          ← todos, onToggle, onRename, onDelete
        └── TodoItem      ← todo, onToggle, onRename, onDelete
```

| 컴포넌트 | 책임 |
|---|---|
| `useTodos` (훅) | 목록 상태, Supabase 조회·추가·수정·삭제, 인증 상태 구독 |
| `TodoApp` | 훅의 상태를 보고 어떤 화면(로딩, 오류, 빈 데이터, 목록)을 보여줄지 결정 |
| `TodoForm` | 입력값과 제출 상태 관리, 빈 입력 검증 |
| `TodoList` | 배열을 목록으로 렌더링 (`key`는 고유 id) |
| `TodoItem` | 한 건의 완료 체크, 제목 수정(Enter 저장, Esc 취소), 삭제 |
| `StatusMessage` | 상태 메시지 표시 (여러 화면에서 재사용) |
| `AuthForm` | `mode` Props 하나로 로그인과 회원가입에 재사용 |

데이터를 다루는 코드는 `useTodos` 훅에, 화면을 그리는 코드는 컴포넌트에 두어 역할을 분리했습니다.

## React Hook 사용

| 훅 | 사용 위치 | 용도 |
|---|---|---|
| `useState` | 폼, 항목, `useTodos` | 입력값, 수정 모드, 목록·로딩·오류 상태 |
| `useEffect` | `useTodos` | ① 목록 비동기 조회 ② 인증 상태 구독 |
| `useCallback` | `useTodos`, `TodoApp` | 자식에 넘기는 함수의 참조 유지 |
| `memo` | `TodoItem` | 다른 항목이 바뀔 때 불필요한 리렌더링 방지 |

- **의존성 배열**: 목록 조회 effect는 `[supabase, reloadKey]`, 구독 effect는 `[supabase, router]`로 effect 안에서 쓰는 값을 모두 명시했습니다. Supabase 클라이언트는 `useState` 초기화 함수로 한 번만 만들어 렌더링마다 바뀌지 않게 했습니다.
- **클린업 함수**: 목록 조회 effect는 `ignore` 플래그로 늦게 도착한 응답을 버리고, 인증 상태 구독 effect는 `subscription.unsubscribe()`로 구독을 해제합니다.
- 목록의 변경은 `map`, `filter`, 전개 연산으로 새 배열을 만들어 반영합니다.

## 상태별 UI

`TodoApp`에서 다음 순서로 조건부 렌더링합니다.

| 상태 | 조건 | 화면 |
|---|---|---|
| 로딩 | `isLoading` | "할 일을 불러오는 중입니다" |
| 오류 | `loadError` | 오류 안내와 "다시 시도" 버튼 |
| 빈 데이터 | `todos.length === 0` | "아직 할 일이 없습니다"와 입력 안내 |
| 성공 | 그 외 | 할 일 목록과 완료 진행률 |

추가·수정·삭제가 실패하면 목록은 유지하고 폼 아래에 오류 메시지를 따로 표시합니다.

## 라우팅

| 경로 | 설명 | 접근 |
|---|---|---|
| `/` | 첫 화면 | 로그인 상태면 `/todos`로 이동 |
| `/login`, `/signup` | 로그인, 회원가입 | 로그인 상태면 `/todos`로 이동 |
| `/todos` | 할 일 목록 | 로그인 필요 |
| `/todos/[id]` | 할 일 상세 (동적 라우트) | 로그인 필요, 본인 것만 |

- **동적 라우트 파라미터 처리**: `id`가 숫자가 아니거나(`/todos/abc`), 존재하지 않거나, 다른 회원의 할 일이면 `notFound()`로 전용 안내 화면을 보여줍니다.
- **내비게이션**: 페이지 이동은 `Link`를 사용해 전체 새로고침 없이 전환하고, 전환 중에는 `loading.tsx`를 보여줍니다. 로그인 후에는 목록으로, 로그아웃 후에는 로그인 화면으로 이동합니다.
- **접근 제어**: `proxy.ts`가 모든 요청에서 세션을 확인해 미인증 사용자를 `/login`으로 보내고, 각 서버 페이지에서도 한 번 더 확인합니다.

## 서버 컴포넌트와 클라이언트 컴포넌트 구분

상호작용(상태, 이벤트)이 필요한 부분만 클라이언트 컴포넌트로 만들고 나머지는 서버 컴포넌트로 두었습니다.

| 대상 | 방식 | 선택 근거 |
|---|---|---|
| `layout.tsx`, `Header` | 서버 | 상호작용이 없고, 로그인 정보를 서버에서 조회해 완성된 HTML로 전달. `Suspense`로 감싸 나머지 화면을 먼저 보여줌 |
| `todos/[id]/page.tsx` (상세) | 서버 | 대부분 읽기 전용. 서버에서 조회해 브라우저의 추가 요청 없이 바로 표시하고, 없는 데이터는 서버에서 404 처리 |
| `todos/page.tsx` (목록 페이지) | 서버 | 인증 확인과 날짜 계산을 서버에서 처리한 뒤 결과만 Props로 전달 |
| `TodoApp`, `TodoForm`, `TodoItem` | 클라이언트 | 입력, 클릭 이벤트가 있고 추가·수정·삭제 결과를 즉시 화면에 반영해야 함 |
| `MemoEditor` | 클라이언트 | 서버 컴포넌트인 상세 페이지 안에서 입력이 필요한 부분만 분리 |
| `AuthForm`, `SignOutButton` | 클라이언트 | 폼 입력과 버튼 이벤트 |
| `TodoList`, `StatusMessage` | 지시어 없음 | 상태와 이벤트가 없어 서버·클라이언트 어디서든 재사용 가능 |

**성능 고려**

- `'use client'`를 페이지나 레이아웃이 아닌 말단 컴포넌트에만 선언해 브라우저로 보내는 JavaScript를 줄였습니다.
- 정적인 틀은 미리 렌더링하고, 로그인 정보처럼 요청마다 달라지는 부분은 `Suspense` 경계 안에서 스트리밍합니다.
- 목록은 필요한 컬럼만 조회하고, `(user_id, created_at)` 인덱스로 정렬 조회를 지원합니다.
- 추가·수정·삭제 후 목록 전체를 다시 조회하지 않고 응답으로 받은 한 건만 상태에 반영합니다.

## 데이터와 보안

| 테이블 | 내용 |
|---|---|
| `profiles` | 회원 닉네임. 가입 시 트리거로 자동 생성 (`auth.users`와 1:1) |
| `todos` | 할 일. `user_id` 기본값이 `auth.uid()`라 로그인한 사용자의 것으로 저장 |

- 두 테이블 모두 RLS를 활성화해 본인 데이터만 조회·추가·수정·삭제할 수 있습니다. 화면에서 숨기는 것이 아니라 데이터베이스가 직접 차단합니다.
- 브라우저에는 `anon` 키만 사용하며, `service_role` 키는 사용하지 않습니다.
- 환경 변수는 `.env.local`과 Vercel 프로젝트 설정에만 두고 저장소에는 올리지 않습니다.

## 실행 방법

1. Supabase 프로젝트의 SQL Editor에서 `supabase/schema.sql` 실행
2. 환경 변수 설정

   ```bash
   cp .env.example .env.local   # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 입력
   ```

3. 실행

   ```bash
   npm install
   npm run dev                  # http://localhost:3000
   ```

## 배포 (Vercel)

1. GitHub 저장소에 푸시
2. Vercel에서 저장소를 Import
3. Environment Variables에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 등록 후 Deploy
4. Supabase Authentication의 URL 설정에서 Site URL을 Vercel 주소로 변경
