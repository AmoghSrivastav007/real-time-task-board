'use client';

import { Draggable } from '@hello-pangea/dnd';
import type { Task } from '@/store/board';
import { getInitials, avatarColor } from '@/components/ui/Avatar';

interface Props {
  task: Task;
  index: number;
  onClick: () => void;
  listView?: boolean;
  completed?: boolean;
}

const priorityBorder = {
  LOW: 'border-l-green-500',
  MEDIUM: 'border-l-yellow-500',
  HIGH: 'border-l-red-500',
};

const priorityBadge = {
  LOW: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

export default function TaskCard({ task, index, onClick, listView = false, completed = false }: Props) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`group bg-white dark:bg-[#16213E] border-l-4 ${priorityBorder[task.priority]} rounded-lg cursor-pointer select-none transition-all duration-150 ${
            listView ? 'flex items-center gap-4 px-4 py-3' : 'p-3'
          } ${
            snapshot.isDragging
              ? 'shadow-lg ring-2 ring-[#1A73E8]/40 rotate-1 scale-105'
              : 'shadow-sm hover:shadow-md border border-l-4 border-gray-100 dark:border-slate-700/50 hover:border-gray-200 dark:hover:border-slate-600'
          } ${completed ? 'opacity-60' : ''}`}
        >
          {listView ? (
            <>
              <p className={`flex-1 text-sm text-gray-800 dark:text-gray-100 font-medium truncate ${completed ? 'line-through' : ''}`}>{task.title}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${priorityBadge[task.priority]}`}>
                {task.priority}
              </span>
              {task.dueDate && (
                <span className={`text-xs shrink-0 ${isOverdue ? 'text-red-500' : 'text-gray-400 dark:text-slate-500'}`}>
                  {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
              {task.assignee && (
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${avatarColor(task.assignee.name)}`}
                  title={task.assignee.name}
                >
                  {getInitials(task.assignee.name)}
                </div>
              )}
            </>
          ) : (
            <>
              <p className={`text-sm text-gray-800 dark:text-gray-100 font-medium leading-snug mb-2 ${completed ? 'line-through' : ''}`}>{task.title}</p>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${priorityBadge[task.priority]}`}>
                  {task.priority}
                </span>
                <div className="flex items-center gap-2">
                  {task.dueDate && (
                    <span className={`text-xs ${isOverdue ? 'text-red-500' : 'text-gray-400 dark:text-slate-500'}`}>
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
            </>
          )}
        </div>
      )}
    </Draggable>
  );
}
