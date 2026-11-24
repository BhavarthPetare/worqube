import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Download, FileText, Loader2, Pencil, Plus, Trash2, Users } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { errorMessage } from '@/lib/api';
import { APPLICATION_STATUSES, STATUS_LABELS, type ApplicationStatus } from '@/lib/constants';
import { resumeUrl, useApplicants, useDeleteJob, useJobs, useSetJobActive, useUpdateApplicationStatus } from '@/lib/queries';
import type { Applicant, Job } from '@/lib/types';
import JobFormDialog from './JobFormDialog';

export default function JobsTab() {
  const { toast } = useToast();
  const jobs = useJobs();
  const setActive = useSetJobActive();
  const deleteJob = useDeleteJob();
  const [form, setForm] = useState<{ open: boolean; job: Job | null }>({ open: false, job: null });
  const [applicantsFor, setApplicantsFor] = useState<Job | null>(null);
  const [toDelete, setToDelete] = useState<Job | null>(null);

  const companies = useMemo(
    () => [...new Set((jobs.data ?? []).map((j) => j.company.name))].sort(),
    [jobs.data],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Jobs & applicants</h1>
          <p className="text-muted-foreground">Post openings, close them, and move applicants through the process.</p>
        </div>
        <Button onClick={() => setForm({ open: true, job: null })}><Plus size={16} className="mr-1" /> Post a job</Button>
      </div>

      {jobs.isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={28} /></div>
      ) : jobs.isError ? (
        <p className="text-destructive">{errorMessage(jobs.error)}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Eligibility</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead className="text-right">Applicants</TableHead>
                <TableHead>Open</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.data?.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <p className="font-medium">{job.role}</p>
                    <p className="text-xs text-muted-foreground">{job.company.name} · {job.type}{job.location ? ` · ${job.location}` : ''}</p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    CGPA {job.eligibility.minCgpa}+ · {job.eligibility.branches.length ? job.eligibility.branches.join('/') : 'All branches'}
                  </TableCell>
                  <TableCell className="text-sm">{job.deadline ? format(new Date(`${job.deadline}T00:00:00`), 'd MMM yyyy') : '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setApplicantsFor(job)}>
                      <Users size={14} className="mr-1" /> {job.applicantCount ?? 0}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={job.isActive}
                      aria-label={job.isActive ? 'Close job' : 'Reopen job'}
                      onCheckedChange={(isActive) =>
                        setActive.mutate({ id: job.id, isActive }, {
                          onError: (e) => toast({ title: 'Could not update job', description: errorMessage(e), variant: 'destructive' }),
                        })
                      }
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <Button variant="ghost" size="icon" aria-label="Edit job" onClick={() => setForm({ open: true, job })}><Pencil size={16} /></Button>
                    <Button variant="ghost" size="icon" aria-label="Delete job" className="text-muted-foreground hover:text-destructive" onClick={() => setToDelete(job)}><Trash2 size={16} /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {jobs.data?.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No jobs yet. Post the first one.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <JobFormDialog open={form.open} job={form.job} companies={companies} onClose={() => setForm({ open: false, job: null })} />
      <ApplicantsDialog job={applicantsFor} onClose={() => setApplicantsFor(null)} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.role} at {toDelete?.company.name} and its {toDelete?.applicantCount ?? 0} application(s) will be permanently deleted.
              To stop new applications but keep the record, close the job instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                toDelete && deleteJob.mutate(toDelete.id, {
                  onSuccess: () => toast({ title: 'Job deleted' }),
                  onError: (e) => toast({ title: 'Could not delete', description: errorMessage(e), variant: 'destructive' }),
                })
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function toCsv(job: Job, rows: Applicant[]) {
  const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = ['Name', 'Email', 'Roll number', 'Branch', 'Year', 'CGPA', 'Backlogs', 'Status', 'Applied on'];
  const lines = rows.map((a) =>
    [a.student.fullName, a.student.email, a.student.rollNumber, a.student.department, a.student.year, a.student.cgpa, a.student.activeBacklogs, STATUS_LABELS[a.status], format(new Date(a.createdAt), 'yyyy-MM-dd')]
      .map(cell)
      .join(','),
  );
  const blob = new Blob([[header.map(cell).join(','), ...lines].join('\n')], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${job.company.name}-${job.role}-applicants.csv`.replace(/[^\w.-]+/g, '_');
  link.click();
  URL.revokeObjectURL(link.href);
}

function ApplicantsDialog({ job, onClose }: { job: Job | null; onClose: () => void }) {
  const { toast } = useToast();
  const applicants = useApplicants(job?.id ?? null);
  const update = useUpdateApplicationStatus();

  return (
    <Dialog open={!!job} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Applicants: {job?.role}</DialogTitle>
          <DialogDescription>{job?.company.name}. Changing a status updates the student's dashboard immediately.</DialogDescription>
        </DialogHeader>

        {applicants.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
        ) : !applicants.data?.length ? (
          <p className="py-10 text-center text-muted-foreground">No applications yet.</p>
        ) : (
          <>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => job && toCsv(job, applicants.data)}>
                <Download size={14} className="mr-1" /> Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Branch / Year</TableHead>
                    <TableHead className="text-right">CGPA</TableHead>
                    <TableHead>Resume</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applicants.data.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <p className="font-medium">{a.student.fullName}</p>
                        <p className="text-xs text-muted-foreground">{a.student.rollNumber ?? a.student.email}</p>
                      </TableCell>
                      <TableCell>{a.student.department} · {a.student.year}</TableCell>
                      <TableCell className="text-right">{a.student.cgpa}</TableCell>
                      <TableCell>
                        {a.student.resume?.fileId ? (
                          <a href={resumeUrl(a.student.id)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                            <FileText size={14} /> Open
                          </a>
                        ) : <Badge variant="outline">None</Badge>}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={a.status}
                          onValueChange={(status) =>
                            update.mutate({ id: a.id, status: status as ApplicationStatus }, {
                              onError: (e) => toast({ title: 'Could not update status', description: errorMessage(e), variant: 'destructive' }),
                            })
                          }
                        >
                          <SelectTrigger className="w-36" aria-label={`Status for ${a.student.fullName}`}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {APPLICATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
