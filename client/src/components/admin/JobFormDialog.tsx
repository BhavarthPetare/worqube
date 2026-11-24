import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { errorMessage } from '@/lib/api';
import { DEPARTMENTS, DEPARTMENT_NAMES, JOB_TYPES, type Department, type JobType } from '@/lib/constants';
import { useSaveJob } from '@/lib/queries';
import type { Job } from '@/lib/types';

interface Form {
  companyName: string;
  role: string;
  description: string;
  location: string;
  type: JobType;
  salaryRange: string;
  skills: string;
  minCgpa: string;
  maxBacklogs: string;
  branches: Department[];
  deadline: string;
  isActive: boolean;
}

const empty: Form = {
  companyName: '', role: '', description: '', location: '', type: 'Full-time', salaryRange: '',
  skills: '', minCgpa: '7', maxBacklogs: '0', branches: [], deadline: '', isActive: true,
};

const fromJob = (job: Job): Form => ({
  companyName: job.company.name,
  role: job.role,
  description: job.description,
  location: job.location ?? '',
  type: job.type,
  salaryRange: job.salaryRange ?? '',
  skills: job.requiredSkills.join(', '),
  minCgpa: String(job.eligibility.minCgpa),
  maxBacklogs: String(job.eligibility.maxBacklogs),
  branches: job.eligibility.branches,
  deadline: job.deadline ?? '',
  isActive: job.isActive,
});

interface Props {
  open: boolean;
  job: Job | null; // null = create
  companies: string[];
  onClose: () => void;
}

export default function JobFormDialog({ open, job, companies, onClose }: Props) {
  const { toast } = useToast();
  const save = useSaveJob();
  const [form, setForm] = useState<Form>(empty);

  useEffect(() => {
    if (open) setForm(job ? fromJob(job) : empty);
  }, [open, job]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = () => {
    save.mutate(
      {
        id: job?.id,
        input: {
          companyName: form.companyName,
          role: form.role,
          description: form.description,
          location: form.location || undefined,
          type: form.type,
          salaryRange: form.salaryRange || undefined,
          requiredSkills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
          eligibility: {
            minCgpa: Number(form.minCgpa) || 0,
            branches: form.branches,
            maxBacklogs: Number(form.maxBacklogs) || 0,
          },
          deadline: form.deadline || null,
          isActive: form.isActive,
        },
      },
      {
        onSuccess: () => {
          toast({ title: job ? 'Job updated' : 'Job posted' });
          onClose();
        },
        onError: (err) => toast({ title: 'Could not save job', description: errorMessage(err), variant: 'destructive' }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{job ? 'Edit job' : 'Post a job'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company *</Label>
            <Input id="companyName" list="company-options" value={form.companyName} onChange={(e) => set('companyName', e.target.value)} />
            <datalist id="company-options">{companies.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Input id="role" value={form.role} onChange={(e) => set('role', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={form.type} onValueChange={(v) => set('type', v as JobType)}>
              <SelectTrigger id="type"><SelectValue /></SelectTrigger>
              <SelectContent>{JOB_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={form.location} onChange={(e) => set('location', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salaryRange">Package / stipend</Label>
            <Input id="salaryRange" placeholder="e.g. 10-12 LPA" value={form.salaryRange} onChange={(e) => set('salaryRange', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Apply by</Label>
            <Input id="deadline" type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="skills">Required skills</Label>
            <Input id="skills" placeholder="Comma-separated, e.g. Java, SQL" value={form.skills} onChange={(e) => set('skills', e.target.value)} />
          </div>
        </div>

        <fieldset className="space-y-3 rounded-md border p-4">
          <legend className="px-1 text-sm font-medium">Eligibility</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minCgpa">Minimum CGPA</Label>
              <Input id="minCgpa" type="number" step="0.1" min="0" max="10" value={form.minCgpa} onChange={(e) => set('minCgpa', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxBacklogs">Max active backlogs</Label>
              <Input id="maxBacklogs" type="number" min="0" value={form.maxBacklogs} onChange={(e) => set('maxBacklogs', e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm">Branches <span className="text-muted-foreground">(none selected = all branches)</span></p>
            <div className="flex flex-wrap gap-2">
              {DEPARTMENTS.map((d) => {
                const active = form.branches.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    title={DEPARTMENT_NAMES[d]}
                    aria-pressed={active}
                    onClick={() => set('branches', active ? form.branches.filter((b) => b !== d) : [...form.branches, d])}
                  >
                    <Badge variant={active ? 'default' : 'outline'} className="cursor-pointer px-3 py-1">{d}</Badge>
                  </button>
                );
              })}
            </div>
          </div>
        </fieldset>

        <div className="flex items-center gap-2">
          <Switch id="isActive" checked={form.isActive} onCheckedChange={(v) => set('isActive', v)} />
          <Label htmlFor="isActive">Open for applications</Label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={save.isPending}>
            {save.isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
            {job ? 'Save changes' : 'Post job'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
