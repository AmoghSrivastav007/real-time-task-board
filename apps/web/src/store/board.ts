import { create } from 'zustand';

export interface Assignee {
  id: string;
  name: string;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  columnId: string;
  assignee?: Assignee | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  title: string;
  order: number;
  boardId: string;
  tasks: Task[];
}

interface Presence {
  userId: string;
  name: string;
  columnId: string | null;
}

interface BoardState {
  columns: Column[];
  presence: Presence[];
  setColumns: (columns: Column[]) => void;
  addColumn: (column: Column) => void;
  updateColumn: (column: Partial<Column> & { id: string }) => void;
  removeColumn: (columnId: string) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Partial<Task> & { id: string }) => void;
  moveTask: (taskId: string, fromColumnId: string, toColumnId: string, newOrder: number) => void;
  removeTask: (taskId: string) => void;
  setPresence: (presence: Presence) => void;
  removePresence: (userId: string) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  columns: [],
  presence: [],

  setColumns: (columns) => set({ columns }),

  addColumn: (column) =>
    set((s) => ({ columns: [...s.columns, { ...column, tasks: column.tasks ?? [] }].sort((a, b) => a.order - b.order) })),

  updateColumn: (updated) =>
    set((s) => ({
      columns: s.columns.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
    })),

  removeColumn: (columnId) =>
    set((s) => ({ columns: s.columns.filter((c) => c.id !== columnId) })),

  addTask: (task) =>
    set((s) => ({
      columns: s.columns.map((c) =>
        c.id === task.columnId
          ? { ...c, tasks: [...c.tasks, task].sort((a, b) => a.order - b.order) }
          : c
      ),
    })),

  updateTask: (updated) =>
    set((s) => ({
      columns: s.columns.map((c) => ({
        ...c,
        tasks: c.tasks.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
      })),
    })),

  moveTask: (taskId, fromColumnId, toColumnId, newOrder) =>
    set((s) => {
      const task = s.columns.flatMap((c) => c.tasks).find((t) => t.id === taskId);
      if (!task) return s;

      const updatedTask = { ...task, columnId: toColumnId, order: newOrder };

      return {
        columns: s.columns.map((c) => {
          if (c.id === fromColumnId && c.id !== toColumnId) {
            return { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) };
          }
          if (c.id === toColumnId && c.id !== fromColumnId) {
            const tasks = [...c.tasks, updatedTask].sort((a, b) => a.order - b.order);
            return { ...c, tasks };
          }
          if (c.id === fromColumnId && c.id === toColumnId) {
            const tasks = c.tasks
              .map((t) => (t.id === taskId ? updatedTask : t))
              .sort((a, b) => a.order - b.order);
            return { ...c, tasks };
          }
          return c;
        }),
      };
    }),

  removeTask: (taskId) =>
    set((s) => ({
      columns: s.columns.map((c) => ({
        ...c,
        tasks: c.tasks.filter((t) => t.id !== taskId),
      })),
    })),

  setPresence: (presence) =>
    set((s) => ({
      presence: [
        ...s.presence.filter((p) => p.userId !== presence.userId),
        presence,
      ],
    })),

  removePresence: (userId) =>
    set((s) => ({ presence: s.presence.filter((p) => p.userId !== userId) })),
}));
