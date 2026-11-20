import TodoItem from "@/components/TodoItem";
import type { Todo } from "@/types/todo";

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: number, isDone: boolean) => Promise<boolean>;
  onRename: (id: number, title: string) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
}

/** 할 일 배열을 목록으로 렌더링한다. key는 변하지 않는 고유 id를 쓴다. */
export default function TodoList({ todos, onToggle, onRename, onDelete }: TodoListProps) {
  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
