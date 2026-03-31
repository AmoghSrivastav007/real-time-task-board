'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useBoardStore, Task } from '@/store/board';
import { getSocket } from '@/lib/socket';

interface Author { id: string; name: string; email: string; }
interface Comment { id: string; content: string; taskId: string; createdAt: string; updatedAt: string; author: Author; }
interface Uploader { id: string; name: string; }
interface Attachment { id: string; filename: string; fileUrl: string; fileSize: number; mimeType: string; taskId: string; createdAt: string; uploader: Uploader; }

interface Props {
  task: Task;
  boardId: string;
  onClose: () => void;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function TaskModal({ task, boardId, onClose }: Props) {
  const { accessToken, user } = useAuthStore();
  const { updateTask, removeTask } = useBoardStore();
  const overlayRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
    assigneeId: task.assignee?.id || '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [editingComment, setEditingComment] = useState<{ id: string; content: string } | null>(null);
  const [postingComment, setPostingComment] = useState(false);

  // Attachments state
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Load comments and attachments
  useEffect(() => {
    if (!accessToken) return;
    api.get<Comment[]>(`/api/tasks/${task.id}/comments`, accessToken).then(setComments).catch(console.error);
    api.get<Attachment[]>(`/api/tasks/${task.id}/attachments`, accessToken).then(setAttachments).catch(console.error);
  }, [task.id, accessToken]);

  // Real-time comment/attachment events
  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);

    const onCommentCreated = (c: Comment) => {
      if (c.taskId === task.id) setComments((prev) => [...prev.filter((x) => x.id !== c.id), c]);
    };
    const onCommentUpdated = (c: Comment) => {
      if (c.taskId === task.id) setComments((prev) => prev.map((x) => x.id === c.id ? c : x));
    };
    const onCommentDeleted = ({ commentId, taskId }: { commentId: string; taskId: string }) => {
      if (taskId === task.id) setComments((prev) => prev.filter((x) => x.id !== commentId));
    };
    const onAttachmentCreated = (a: Attachment) => {
      if (a.taskId === task.id) setAttachments((prev) => [...prev.filter((x) => x.id !== a.id), a]);
    };
    const onAttachmentDeleted = ({ attachmentId, taskId }: { attachmentId: string; taskId: string }) => {
      if (taskId === task.id) setAttachments((prev) => prev.filter((x) => x.id !== attachmentId));
    };

    socket.on('comment:created', onCommentCreated);
    socket.on('comment:updated', onCommentUpdated);
    socket.on('comment:deleted', onCommentDeleted);
    socket.on('attachment:created', onAttachmentCreated);
    socket.on('attachment:deleted', onAttachmentDeleted);

    return () => {
      socket.off('comment:created', onCommentCreated);
      socket.off('comment:updated', onCommentUpdated);
      socket.off('comment:deleted', onCommentDeleted);
      socket.off('attachment:created', onAttachmentCreated);
      socket.off('attachment:deleted', onAttachmentDeleted);
    };
  }, [task.id, accessToken]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setSaving(true);
    try {
      const updated = await api.patch<Task>(`/api/tasks/${task.id}`, {
        ...form,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        assigneeId: form.assigneeId || null,
      }, accessToken);
      updateTask(updated);
      onClose();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!confirm('Delete this task?') || !accessToken) return;
    setDeleting(true);
    try {
      await api.delete(`/api/tasks/${task.id}`, accessToken);
      removeTask(task.id);
      onClose();
    } catch (err) { console.error(err); }
    finally { setDeleting(false); }
  }

  async function handlePostComment(e?: React.FormEvent) {
    e?.preventDefault();
    if (!commentText.trim() || !accessToken) return;
    setPostingComment(true);
    try {
      const c = await api.post<Comment>(`/api/tasks/${task.id}/comments`, { content: commentText }, accessToken);
      setComments((prev) => [...prev, c]);
      setCommentText('');
    } catch (err) { console.error(err); }
    finally { setPostingComment(false); }
  }

  async function handleEditComment() {
    if (!editingComment || !accessToken) return;
    try {
      const c = await api.patch<Comment>(`/api/comments/${editingComment.id}`, { content: editingComment.content }, accessToken);
      setComments((prev) => prev.map((x) => x.id === c.id ? c : x));
      setEditingComment(null);
    } catch (err) { console.error(err); }
  }

  async function handleDeleteComment(id: string) {
    if (!accessToken) return;
    try {
      await api.delete(`/api/comments/${id}`, accessToken);
      setComments((prev) => prev.filter((x) => x.id !== id));
    } catch (err) { console.error(err); }
  }

  async function uploadFile(file: File) {
    if (!accessToken) return;
    setUploading(true);
    setUploadProgress(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${BASE_URL}/api/tasks/${task.id}/attachments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const a: Attachment = await res.json();
      setAttachments((prev) => [...prev, a]);
    } catch (err) { console.error(err); }
    finally { setUploading(false); setUploadProgress(false); }
  }

  async function handleDeleteAttachment(id: string) {
    if (!accessToken) return;
    try {
      await api.delete(`/api/attachments/${id}`, accessToken);
      setAttachments((prev) => prev.filter((x) => x.id !== id));
    } catch (err) { console.error(err); }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-[#16213E] border border-gray-100 dark:border-slate-700 rounded-2xl shadow-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <h2 className="text-gray-800 dark:text-white font-semibold">Edit Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">✕</button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Task form */}
          <form onSubmit={handleSave} className="p-6 space-y-4 border-b border-gray-100 dark:border-slate-800">
            <div>
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Title</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-white text-sm focus:outline-none focus:border-[#1A73E8]"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-white text-sm focus:outline-none focus:border-[#1A73E8] resize-none"
                placeholder="Add a description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as Task['priority'] })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-white text-sm focus:outline-none focus:border-[#1A73E8]"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-white text-sm focus:outline-none focus:border-[#1A73E8]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Assignee ID (optional)</label>
              <input
                type="text"
                value={form.assigneeId}
                onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-white text-sm focus:outline-none focus:border-[#1A73E8]"
                placeholder="User ID..."
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete task'}
              </button>
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-[#1A73E8] hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          </form>

          {/* Attachments section */}
          <div className="p-6 border-b border-gray-100 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-slate-300">Attachments ({attachments.length})</h3>

            {/* Drop zone */}
            <div
              ref={dropRef}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${dragOver ? 'border-[#1A73E8] bg-blue-50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500'}`}
            >
              <p className="text-xs text-gray-400 dark:text-slate-400 mb-2">Drag & drop a file here, or</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-slate-200 disabled:opacity-50 transition-colors"
              >
                {uploading ? 'Uploading...' : 'Attach file'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.zip"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ''; }}
              />
              {uploadProgress && (
                <div className="mt-2 h-1 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-[#1A73E8] animate-pulse w-full" />
                </div>
              )}
            </div>

            {/* Attachment list */}
            {attachments.length > 0 && (
              <ul className="space-y-2">
                {attachments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-400 text-lg">📎</span>
                      <div className="min-w-0">
                        <a
                          href={a.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#1A73E8] hover:underline truncate block"
                        >
                          {a.filename}
                        </a>
                        <p className="text-xs text-gray-400 dark:text-slate-500">{formatBytes(a.fileSize)} · {timeAgo(a.createdAt)} · {a.uploader.name}</p>
                      </div>
                    </div>
                    {(a.uploader.id === user?.id || user?.role === 'ADMIN') && (
                      <button
                        onClick={() => handleDeleteAttachment(a.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors ml-2 shrink-0 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Comments section */}
          <div className="p-6 space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-slate-300">Comments ({comments.length})</h3>

            {/* Comment list */}
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#1A73E8] flex items-center justify-center text-white text-xs font-medium shrink-0">
                    {c.author.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-700 dark:text-slate-300">{c.author.name}</span>
                      <span className="text-xs text-gray-400 dark:text-slate-500">{timeAgo(c.createdAt)}</span>
                    </div>
                    {editingComment?.id === c.id ? (
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          value={editingComment.content}
                          onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleEditComment(); if (e.key === 'Escape') setEditingComment(null); }}
                          className="flex-1 px-2 py-1 rounded bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-white text-sm focus:outline-none focus:border-[#1A73E8]"
                        />
                        <button onClick={handleEditComment} className="text-xs text-[#1A73E8] hover:underline">Save</button>
                        <button onClick={() => setEditingComment(null)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">Cancel</button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 dark:text-slate-300 break-words">{c.content}</p>
                    )}
                    {c.author.id === user?.id && editingComment?.id !== c.id && (
                      <div className="flex gap-3 mt-1">
                        <button onClick={() => setEditingComment({ id: c.id, content: c.content })} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">Edit</button>
                        <button onClick={() => handleDeleteComment(c.id)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* New comment input */}
            <form onSubmit={handlePostComment} className="flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostComment(); } }}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-white text-sm focus:outline-none focus:border-[#1A73E8] placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={postingComment || !commentText.trim()}
                className="px-4 py-2 rounded-lg bg-[#1A73E8] hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
