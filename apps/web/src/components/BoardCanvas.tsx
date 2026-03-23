'use client';

import { useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useBoardStore } from '@/store/board';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import Column from './Column';
import TaskModal from './TaskModal';
import type { Task } from '@/store/board';

interface Props {
  boardId: string;
}

export default function BoardCanvas({ boardId }: Props) {
  const { columns, moveTask, addColumn } = useBoardStore();
  const { accessToken } = useAuthStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');

  async function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const fromColumnId = source.droppableId;
    const toColumnId = destination.droppableId;
    const newOrder = destination.index;

    // Optimistic update
    moveTask(draggableId, fromColumnId, toColumnId, newOrder);

    try {
      await api.patch(`/api/tasks/${draggableId}/move`, { toColumnId, newOrder }, accessToken!);
      // Socket event is emitted by the server after the API call
    } catch {
      // Rollback: reload columns
      const cols = await api.get<any[]>(`/api/boards/${boardId}/columns`, accessToken!);
      useBoardStore.getState().setColumns(cols);
    }
  }

  async function handleAddColumn(e: React.FormEvent) {
    e.preventDefault();
    if (!newColTitle.trim() || !accessToken) return;
    try {
      await api.post(`/api/boards/${boardId}/columns`, { title: newColTitle }, accessToken);
      setNewColTitle('');
      setAddingColumn(false);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 p-6 overflow-x-auto h-full items-start">
          {columns.map((col) => (
            <Column
              key={col.id}
              column={col}
              onTaskClick={setSelectedTask}
            />
          ))}

          {/* Add column */}
          <div className="shrink-0 w-72">
            {addingColumn ? (
              <form onSubmit={handleAddColumn} className="bg-slate-800 rounded-xl p-3 space-y-2">
                <input
                  autoFocus
                  type="text"
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  placeholder="Column name..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingColumn(false); setNewColTitle(''); }}
                    className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setAddingColumn(true)}
                className="w-full py-3 rounded-xl border-2 border-dashed border-slate-700 hover:border-slate-500 text-slate-500 hover:text-slate-300 text-sm transition-colors"
              >
                + Add Column
              </button>
            )}
          </div>
        </div>
      </DragDropContext>

      {selectedTask && (
        <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </>
  );
}
