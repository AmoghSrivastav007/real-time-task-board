'use client';

import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { useBoardStore, Column as ColumnType, Task } from '@/store/board';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import TaskCard from './TaskCard';

interface Props {
  column: ColumnType;
  onTaskClick: (task: Task) => void;
}

export default function Column({ column, onTaskClick }: Props) {
  const { updateColumn, removeColumn } = useBoardStore();
  const { accessToken } = useAuthStore();
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  async function saveTitle() {
    if (!title.trim() || title === column.title) { setEditingTitle(false); return; }
    try {
      const updated = await api.patch<ColumnType>(`/api/columns/${column.id}`, { title }, accessToken!);
      updateColumn(updated);
    } catch { setTitle(column.title); }
    setEditingTitle(false);
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim() || !accessToken) return;
    try {
      await api.post(`/api/columns/${column.id}/tasks`, { title: newTaskTitle }, accessToken);
      setNewTaskTitle('');
      setAddingTask(false);
    } catch (err) { console.error(err); }
  }

  async function handleDelete() {
    if (!confirm(`Delete column "${column.title}" and all its tasks?`)) return;
    try {
      await api.delete(`/api/columns/${column.id}`, accessToken!);
      removeColumn(column.id);
    } catch (err) { console.error(err); }
  }

  return (
    <div className="shrink-0 w-72 flex flex-col bg-slate-900 rounded-xl border border-slate-800 max-h-[calc(100vh-120px)]">
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        {editingTitle ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitle(column.title); setEditingTitle(false); } }}
            className="flex-1 bg-transparent text-white text-sm font-medium focus:outline-none border-b border-indigo-500"
          />
        ) : (
          <button
            onClick={() => setEditingTitle(true)}
            className="flex-1 text-left text-sm font-medium text-slate-200 hover:text-white transition-colors"
          >
            {column.title}
          </button>
        )}
        <div className="flex items-center gap-1 ml-2">
          <span className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-full">
            {column.tasks.length}
          </span>
          <button
            onClick={handleDelete}
            className="text-slate-600 hover:text-red-400 transition-colors ml-1 text-xs"
            title="Delete column"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Task list */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto p-2 space-y-2 transition-colors ${
              snapshot.isDraggingOver ? 'bg-slate-800/50' : ''
            }`}
          >
            {column.tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onClick={() => onTaskClick(task)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add task */}
      <div className="p-2 border-t border-slate-800">
        {addingTask ? (
          <form onSubmit={handleAddTask} className="space-y-2">
            <input
              autoFocus
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <div className="flex gap-2">
              <button type="submit" className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs transition-colors">
                Add
              </button>
              <button type="button" onClick={() => { setAddingTask(false); setNewTaskTitle(''); }} className="px-3 py-1.5 text-slate-400 hover:text-white text-xs transition-colors">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAddingTask(true)}
            className="w-full py-2 text-slate-500 hover:text-slate-300 text-sm transition-colors text-left px-2"
          >
            + Add task
          </button>
        )}
      </div>
    </div>
  );
}
