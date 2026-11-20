/** todos 테이블의 한 행 */
export interface Todo {
  id: number;
  title: string;
  memo: string | null;
  is_done: boolean;
  created_at: string;
}

/** 목록에서 수정할 수 있는 항목 */
export type TodoChanges = Partial<Pick<Todo, "title" | "memo" | "is_done">>;

/** 목록 조회에 쓰는 컬럼 (user_id는 화면에 필요 없어 제외) */
export const TODO_COLUMNS = "id, title, memo, is_done, created_at";
