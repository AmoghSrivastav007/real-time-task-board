'use client';

import { Draggable } from '@hello-pangea/dnd';
import type { Task } from '@/store/board';

interface Props {
  task: Task;
  index: number;
  onClick: () => void;
}

const priorityConfig = {
  LOW:    { label: 'Low',    classes: 'bg-green-900/40 text-green-400 border-green-800/40' },
  MEDIUM: { label: 'Medium', classes: 'bg-yellow-900/40 text-yellow-400 border-yellow-800/40' },
  HIGH:   { label: 'High',   classes: 'bg-red-900/40 text-red-400 border-red-800/40' },
};

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function avatarColor(name: string) {
  const colors = ['bg-indigo-600', 'bg-violet-600', 'bg-pink-600', 'bg-teal-600', 'bg-orange-600'];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

export default function TaskCard({ task, index, onClick }: Props) {
  const priority = priorityConfig[task.priority];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`group p-3 rounded-lg bg-slate-800 border cursor-pointer transition-all select-none ${
            snapshot.isDragging
              ? 'border-indigo-500 shadow-lg shadow-indigo-900/30 rotate-1 scale-105'
              : 'border-slate-700/50 hover:border-slate-600'
          }`}
        >
          <p className="text-sm text-slate-200 font-medium leading-snug mb-2">{task.title}</p>

          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${priority.classes}`}>
              {priority.label}
            </span>

            <div className="flex items-center gap-2">
              {task.dueDate && (
                <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
                  {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
              {task.assignee && (
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${avatarColor(task.assignee.name)}`}
                  title={task.assignee.name}
                >
                  {getInitials(task.assignee.name)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
