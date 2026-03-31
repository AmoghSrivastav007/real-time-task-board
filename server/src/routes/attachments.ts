import { Router, Response } from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import prisma from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/zip',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) cb(null, true);
    else cb(new Error('File type not allowed'));
  },
});

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

async function getBoardIdFromTask(taskId: string): Promise<string | null> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { column: { select: { boardId: true } } },
  });
  return task?.column.boardId ?? null;
}

// GET /api/tasks/:taskId/attachments
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const attachments = await prisma.attachment.findMany({
    where: { taskId: req.params.taskId },
    orderBy: { createdAt: 'asc' },
    include: { uploader: { select: { id: true, name: true } } },
  });
  res.json(attachments);
});

// POST /api/tasks/:taskId/attachments
router.post(
  '/',
  authenticateToken,
  upload.single('file'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const supabase = getSupabase();
    const ext = req.file.originalname.split('.').pop();
    const storagePath = `${req.params.taskId}/${Date.now()}-${req.file.originalname}`;

    const { error: uploadError } = await supabase.storage
      .from('task-attachments')
      .upload(storagePath, req.file.buffer, { contentType: req.file.mimetype });

    if (uploadError) {
      res.status(500).json({ error: 'Upload failed', detail: uploadError.message });
      return;
    }

    const { data: urlData } = supabase.storage
      .from('task-attachments')
      .getPublicUrl(storagePath);

    const attachment = await prisma.attachment.create({
      data: {
        filename: req.file.originalname,
        fileUrl: urlData.publicUrl,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        taskId: req.params.taskId,
        uploadedBy: req.user!.id,
      },
      include: { uploader: { select: { id: true, name: true } } },
    });

    const boardId = await getBoardIdFromTask(req.params.taskId);
    const io = req.app.get('io');
    if (boardId) io.to(boardId).emit('attachment:created', attachment);

    res.status(201).json(attachment);
  }
);

// DELETE /api/attachments/:id
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await prisma.attachment.findUnique({ where: { id: req.params.id } });
  if (!existing) { res.status(404).json({ error: 'Attachment not found' }); return; }

  const isAdmin = req.user!.role === 'ADMIN';
  if (existing.uploadedBy !== req.user!.id && !isAdmin) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }

  // Extract storage path from URL
  const supabase = getSupabase();
  const url = new URL(existing.fileUrl);
  const storagePath = url.pathname.split('/task-attachments/')[1];
  if (storagePath) {
    await supabase.storage.from('task-attachments').remove([storagePath]);
  }

  await prisma.attachment.delete({ where: { id: req.params.id } });

  const boardId = await getBoardIdFromTask(existing.taskId);
  const io = req.app.get('io');
  if (boardId) io.to(boardId).emit('attachment:deleted', { attachmentId: req.params.id, taskId: existing.taskId });

  res.json({ success: true });
});

export default router;
