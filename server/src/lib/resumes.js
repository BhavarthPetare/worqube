import mongoose from 'mongoose';
import { HttpError } from './errors.js';

// Resumes live in MongoDB GridFS (bucket "resumes"), so the app needs no separate file storage.
const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'resumes' });

export async function saveResume(user, file) {
  // Check the file content, not just the browser-supplied type.
  if (file.mimetype !== 'application/pdf' || file.buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
    throw new HttpError(400, 'Resume must be a PDF file');
  }

  const fileName = `${(user.fullName || 'resume').replace(/[^\w.-]+/g, '_')}.pdf`;
  const upload = bucket().openUploadStream(fileName, {
    metadata: { owner: user._id, contentType: 'application/pdf' },
  });
  await new Promise((resolve, reject) => {
    upload.once('finish', resolve).once('error', reject);
    upload.end(file.buffer);
  });

  const previous = user.resume?.fileId;
  user.resume = { fileId: upload.id, fileName, size: file.size, uploadedAt: new Date() };
  await user.save();
  if (previous) await bucket().delete(previous).catch(() => {});
  return user.resume;
}

export async function streamResume(user, res) {
  if (!user.resume?.fileId) throw new HttpError(404, 'No resume uploaded');
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `inline; filename="${user.resume.fileName}"`,
    'Cache-Control': 'private, no-store',
  });
  await new Promise((resolve, reject) => {
    bucket()
      .openDownloadStream(user.resume.fileId)
      .once('error', () => reject(new HttpError(404, 'Resume file not found')))
      .once('end', resolve)
      .pipe(res);
  });
}

export async function deleteResumesOf(fileIds) {
  await Promise.all(fileIds.filter(Boolean).map((id) => bucket().delete(id).catch(() => {})));
}
