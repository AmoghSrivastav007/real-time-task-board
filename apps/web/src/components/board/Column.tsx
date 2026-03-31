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
  listView?: boolean;
}

export default function Column({ column, onTaskClick, listView = false }: Props) {
  const { updateColumn, removeColumn } = useBoardStore();
  const { accessToken } = useAuthStore();
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(false);

  const activeTasks = column.tasks;
  const completedTasks: Task[] = [];

  async function saveTitle() {
    if (!title.trim() || title === column.title) {
      setEditingTitle(false);
      return;
    }
    try {
      const updated = await api.patch<ColumnType>(`/api/columns/${column.id}`, { title }, accessToken!);
      updateColumn(updated);
    } catch {
      setTitle(column.title);
    }
    setEditingTitle(false);
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim() || !accessToken) return;
    try {
      await api.post(`/api/columns/${column.id}/tasks`, { title: newTaskTitle }, accessToken);
      setNewTaskTitle('');
      setAddingTask(false);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete() {
    setMenuOpen(false);
    if (!confirm(`Delete column "${column.title}" and all its tasks?`)) return;
    try {
      await api.delete(`/api/columns/${column.id}`, accessToken!);
      removeColumn(column.id);
    } catch (err) {
      console.error(err);
    }
  }

  if (listView) {
    return (
      <div className="mb-4 bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-slate-700/50 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{column.title}</span>
          <span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">
            {column.tasks.length}
          </span>
        </div>
        <Droppable droppableId={column.id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`space-y-1.5 rounded-xl transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
            >
              {column.tasks.map((task, index) => (
                <TaskCard key={task.id} task={task} index={index} onClick={() => onTaskClick(task)} listView />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    );
  }

  return (
    <div className="shrink-0 w-72 flex flex-col bg-white dark:bg-[#16213E] rounded-xl shadow-sm border border-gray-100 dark:border-slate-700/50 max-h-[calc(100vh-120px)] transition-colors duration-300">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700/50">
        {editingTitle ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveTitle();
              if (e.key === 'Escape') {
                setTitle(column.title);
                setEditingTitle(false);
              }
            }}
            className="flex-1 bg-transparent text-gray-800 dark:text-white text-sm font-semibold focus:outline-none border-b border-[#1A73E8]"
          />
        ) : (
          <button
            onClick={() => setEditingTitle(true)}
            className="flex-1 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {column.title}
          </button>
        )}
        <div className="flex items-center gap-1.5 ml-2">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute mt-28 w-36 bg-white dark:bg-[#1e2d4a] border border-gray-100 dark:border-slate-700 rounded-lg shadow-lg z-20 py-1 animate-fade-in">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setEditingTitle(true);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Rename
              </button>
              <button
                onClick={handleDelete}
                className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Delete column
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-3 pt-3">
        {addingTask ? (
          <form onSubmit={handleAddTask} className="space-y-2 mb-2">
            <input
              autoFocus
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:border-[#1A73E8]"
            />
            <div className="flex gap-2">
              <button type="submit" className="px-3 py-1.5 rounded-lg bg-[#1A73E8] hover:bg-blue-600 text-white text-xs transition-colors">
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingTask(false);
                  setNewTaskTitle('');
                }}
                className="px-3 py-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAddingTask(true)}
            className="w-full flex items-center gap-1.5 py-2 px-2 rounded-lg text-gray-400 hover:text-[#1A73E8] hover:bg-blue-50 dark:hover:bg-blue-900/10 text-sm transition-colors mb-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add a task
          </button>
        )}
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto px-3 pb-2 space-y-2 transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-50/30 dark:bg-blue-900/5' : ''
            }`}
          >
            {activeTasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} onClick={() => onTaskClick(task)} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <div className="border-t border-gray-100 dark:border-slate-700/50 px-3 py-2">
        <button
          onClick={() => setCompletedOpen((v) => !v)}
          className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors w-full"
        >
          <svg className={`w-3 h-3 transition-transform ${completedOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          Completed ({completedTasks.length})
        </button>
        {completedOpen && (
          <div className="mt-2 text-xs text-gray-400 dark:text-slate-500">
            No completed tasks
          </div>
        )}
      </div>
    </div>
  );
}
