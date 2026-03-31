'use client';

import { useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useBoardStore } from '@/store/board';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import Column from './Column';
import TaskModal from '@/components/TaskModal';
import type { Task } from '@/store/board';

interface Props {
  boardId: string;
  viewMode: 'kanban' | 'list';
}

export default function BoardCanvas({ boardId, viewMode }: Props) {
  const { columns, moveTask } = useBoardStore();
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

    moveTask(draggableId, fromColumnId, toColumnId, newOrder);

    try {
      await api.patch(`/api/tasks/${draggableId}/move`, { toColumnId, newOrder }, accessToken!);
    } catch {
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
        {viewMode === 'list' ? (
          <div className="p-4 md:p-6 max-w-4xl mx-auto transition-all duration-300">
            {columns.map((col) => (
              <Column key={col.id} column={col} onTaskClick={setSelectedTask} listView />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 p-4 md:p-6 overflow-x-auto h-full items-start transition-all duration-300">
            {columns.map((col) => (
              <Column key={col.id} column={col} onTaskClick={setSelectedTask} />
            ))}
            <div className="shrink-0 w-72">
              {addingColumn ? (
                <form onSubmit={handleAddColumn} className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-slate-700/50 p-3 space-y-2 shadow-sm">
                  <input
                    autoFocus
                    type="text"
                    value={newColTitle}
                    onChange={(e) => setNewColTitle(e.target.value)}
                    placeholder="List name..."
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:border-[#1A73E8]"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="px-3 py-1.5 rounded-lg bg-[#1A73E8] hover:bg-blue-600 text-white text-sm transition-colors">
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddingColumn(false);
                        setNewColTitle('');
                      }}
                      className="px-3 py-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setAddingColumn(true)}
                  className="w-full py-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700 hover:border-[#1A73E8] text-gray-400 hover:text-[#1A73E8] text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add new list
                </button>
              )}
            </div>
          </div>
        )}
      </DragDropContext>

      {selectedTask && <TaskModal task={selectedTask} boardId={boardId} onClose={() => setSelectedTask(null)} />}
    </>
  );
}
