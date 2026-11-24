import { useRef, useState } from 'react';
import { FileIcon, Loader2, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth';
import { api, errorMessage } from '@/lib/api';
import { RESUME_MAX_BYTES } from '@/lib/constants';
import { resumeUrl } from '@/lib/queries';
import type { User } from '@/lib/types';

// One resume per student (PDF, max 5 MB). The API checks the file really is a PDF and
// stores it privately; only the student and T&P admins can open it.
const ResumeCard = () => {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const upload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast({ title: 'PDF only', description: 'Please upload your resume as a PDF.', variant: 'destructive' });
      return;
    }
    if (file.size > RESUME_MAX_BYTES) {
      toast({ title: 'File too large', description: 'Resumes must be 5 MB or smaller.', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append('resume', file);
      const { user: updated } = await api<{ user: User }>('/profile/resume', { method: 'POST', form });
      setUser(updated);
      toast({ title: 'Resume uploaded' });
    } catch (err) {
      toast({ title: 'Upload failed', description: errorMessage(err), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const resume = user.resume?.fileId ? user.resume : null;

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-background p-6 sm:flex-row sm:items-center">
      <FileIcon className="shrink-0 text-muted-foreground" size={32} />
      <div className="min-w-0 flex-1">
        <h3 className="font-medium">Resume</h3>
        <p className="text-sm text-muted-foreground">
          {resume
            ? `Uploaded ${new Date(resume.uploadedAt).toLocaleDateString('en-IN')}. The placement cell sees your latest resume.`
            : 'No resume yet. Upload a PDF (max 5 MB) to start applying.'}
        </p>
      </div>
      <div className="flex gap-2">
        {resume && (
          <Button variant="outline" asChild>
            <a href={resumeUrl()} target="_blank" rel="noopener noreferrer">View</a>
          </Button>
        )}
        <Button onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? <Loader2 size={16} className="mr-1.5 animate-spin" /> : <Paperclip size={16} className="mr-1.5" />}
          {resume ? 'Replace' : 'Upload resume'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
};

export default ResumeCard;
