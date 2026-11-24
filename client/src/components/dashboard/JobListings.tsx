import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { BriefcaseIcon, CalendarIcon, CheckCircle2, IndianRupee, Loader2, MapPinIcon, SearchIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { errorMessage } from '@/lib/api';
import { STATUS_LABELS } from '@/lib/constants';
import { useApplyToJob, useJobs } from '@/lib/queries';
import type { Job } from '@/lib/types';

const JobListings = ({ onApplied }: { onApplied?: () => void }) => {
  const { toast } = useToast();
  const jobs = useJobs();
  const apply = useApplyToJob();
  const [search, setSearch] = useState('');
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [selected, setSelected] = useState<Job | null>(null);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (jobs.data ?? []).filter((job) => {
      if (eligibleOnly && !job.eligibilityCheck?.eligible && !job.myStatus) return false;
      if (!term) return true;
      return [job.role, job.company?.name, job.location, ...job.requiredSkills]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term));
    });
  }, [jobs.data, search, eligibleOnly]);

  const handleApply = (job: Job) =>
    apply.mutate(job.id, {
      onSuccess: () => {
        setSelected(null);
        toast({
          title: 'Application submitted',
          description: `You applied for ${job.role} at ${job.company.name}.`,
          action: onApplied ? <ToastAction altText="View my applications" onClick={onApplied}>View</ToastAction> : undefined,
        });
      },
      onError: (error) => toast({ title: 'Could not apply', description: errorMessage(error), variant: 'destructive' }),
    });

  if (jobs.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }
  if (jobs.isError) {
    return <p className="py-20 text-center text-destructive">Could not load jobs: {errorMessage(jobs.error)}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Job openings</h1>
        <p className="text-muted-foreground">Roles posted by the PICT placement cell. Eligibility is checked against your profile.</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search role, company, location or skill"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            aria-label="Search jobs"
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch id="eligible-only" checked={eligibleOnly} onCheckedChange={setEligibleOnly} />
          <Label htmlFor="eligible-only">Eligible only</Label>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          {jobs.data?.length ? 'No jobs match your filters.' : 'No openings right now. Check back soon.'}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((job) => (
            <Card key={job.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold">{job.role}</h2>
                    <p className="text-sm text-muted-foreground">{job.company.name}</p>
                  </div>
                  <Badge variant={job.type === 'Internship' ? 'secondary' : 'default'}>{job.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 text-sm">
                <JobMeta job={job} />
                {job.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {job.requiredSkills.slice(0, 5).map((skill) => (
                      <Badge key={skill} variant="outline" className="font-normal">{skill}</Badge>
                    ))}
                  </div>
                )}
                {!job.myStatus && !job.eligibilityCheck?.eligible && (
                  <p className="text-xs text-amber-700">Not eligible: {job.eligibilityCheck?.reasons.join(' · ')}</p>
                )}
              </CardContent>
              <CardFooter className="gap-2">
                <Button variant="outline" onClick={() => setSelected(job)}>Details</Button>
                <ApplyButton job={job} pending={apply.isPending} onApply={handleApply} />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && (
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selected.role}</DialogTitle>
              <DialogDescription>{selected.company.name}</DialogDescription>
            </DialogHeader>
            <JobMeta job={selected} />
            <p className="whitespace-pre-line text-sm">{selected.description}</p>
            <div className="rounded-md bg-muted/60 p-3 text-sm">
              <p className="mb-1 font-medium">Eligibility</p>
              <ul className="list-inside list-disc text-muted-foreground">
                <li>Minimum CGPA: {selected.eligibility.minCgpa || 'none'}</li>
                <li>Branches: {selected.eligibility.branches.length ? selected.eligibility.branches.join(', ') : 'all'}</li>
                <li>Active backlogs allowed: {selected.eligibility.maxBacklogs}</li>
              </ul>
              {!selected.myStatus && !selected.eligibilityCheck?.eligible && (
                <p className="mt-2 text-amber-700">You can't apply yet: {selected.eligibilityCheck?.reasons.join(' · ')}</p>
              )}
            </div>
            <DialogFooter>
              <ApplyButton job={selected} pending={apply.isPending} onApply={handleApply} />
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

function ApplyButton({ job, pending, onApply }: { job: Job; pending: boolean; onApply: (job: Job) => void }) {
  if (job.myStatus) {
    return (
      <Badge variant="secondary" className="ml-auto gap-1 py-1">
        <CheckCircle2 size={14} /> {STATUS_LABELS[job.myStatus]}
      </Badge>
    );
  }
  return (
    <Button className="ml-auto" disabled={!job.eligibilityCheck?.eligible || pending} onClick={() => onApply(job)}>
      {pending && <Loader2 className="mr-2 animate-spin" size={16} />}Apply
    </Button>
  );
}

function JobMeta({ job }: { job: Job }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
      {job.location && <span className="flex items-center gap-1"><MapPinIcon size={14} />{job.location}</span>}
      {job.salaryRange && <span className="flex items-center gap-1"><IndianRupee size={14} />{job.salaryRange}</span>}
      <span className="flex items-center gap-1"><BriefcaseIcon size={14} />{job.type}</span>
      {job.deadline && (
        <span className="flex items-center gap-1">
          <CalendarIcon size={14} />Apply by {format(new Date(`${job.deadline}T00:00:00`), 'd MMM yyyy')}
        </span>
      )}
    </div>
  );
}

export default JobListings;
