import { useEffect, useState } from 'react';
import { ExternalLink, FileText, Loader2, SearchIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatusBadge from '@/components/student/StatusBadge';
import { errorMessage } from '@/lib/api';
import { DEPARTMENTS, DEPARTMENT_NAMES, YEARS } from '@/lib/constants';
import { resumeUrl, useStudentDetail, useStudents, type StudentFilters } from '@/lib/queries';

const toggle = (list: string[], value: string) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

export default function StudentsTab() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<StudentFilters>({ departments: [], years: [] });
  const [openId, setOpenId] = useState<string | null>(null);

  // Debounce the search box so we don't query on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, q: search.trim() || undefined })), 300);
    return () => clearTimeout(t);
  }, [search]);

  const students = useStudents(filters);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Students</h1>
        <p className="text-muted-foreground">Search and filter registered students; open a profile to see details and applications.</p>
      </div>

      <div className="space-y-4 rounded-lg border bg-background p-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input className="pl-10" placeholder="Search name, email or roll number" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search students" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-20 text-sm text-muted-foreground">Branch</span>
          {DEPARTMENTS.map((d) => (
            <FilterChip key={d} active={filters.departments!.includes(d)} title={DEPARTMENT_NAMES[d]} onClick={() => setFilters((f) => ({ ...f, departments: toggle(f.departments!, d) }))}>
              {d}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-20 text-sm text-muted-foreground">Year</span>
          {YEARS.map((y) => (
            <FilterChip key={y} active={filters.years!.includes(y)} onClick={() => setFilters((f) => ({ ...f, years: toggle(f.years!, y) }))}>
              {y}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Label className="w-20 text-sm font-normal text-muted-foreground" htmlFor="min-cgpa">CGPA</Label>
          <Input id="min-cgpa" type="number" step="0.1" min="0" max="10" placeholder="Min" className="w-24" value={filters.minCgpa ?? ''} onChange={(e) => setFilters((f) => ({ ...f, minCgpa: e.target.value }))} />
          <span className="text-muted-foreground">to</span>
          <Input aria-label="Maximum CGPA" type="number" step="0.1" min="0" max="10" placeholder="Max" className="w-24" value={filters.maxCgpa ?? ''} onChange={(e) => setFilters((f) => ({ ...f, maxCgpa: e.target.value }))} />
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => { setSearch(''); setFilters({ departments: [], years: [] }); }}>
            Clear filters
          </Button>
        </div>
      </div>

      {students.isError ? (
        <p className="text-destructive">{errorMessage(students.error)}</p>
      ) : students.isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={28} /></div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <p className="border-b px-4 py-2 text-sm text-muted-foreground">{students.data?.length ?? 0} students</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Roll no.</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">CGPA</TableHead>
                <TableHead>Resume</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.data?.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <p className="font-medium">{s.fullName}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                  </TableCell>
                  <TableCell>{s.rollNumber ?? '—'}</TableCell>
                  <TableCell>{s.department ?? '—'}</TableCell>
                  <TableCell>{s.year ?? '—'}</TableCell>
                  <TableCell className="text-right">{s.cgpa ?? '—'}</TableCell>
                  <TableCell>{s.resume?.fileId ? <Badge variant="secondary">Uploaded</Badge> : <span className="text-xs text-muted-foreground">Missing</span>}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setOpenId(s.id)}>View</Button>
                  </TableCell>
                </TableRow>
              ))}
              {students.data?.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">No students match these filters.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <StudentDialog id={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

function FilterChip({ active, onClick, children, title }: { active: boolean; onClick: () => void; children: string; title?: string }) {
  return (
    <button type="button" title={title} aria-pressed={active} onClick={onClick}>
      <Badge variant={active ? 'default' : 'outline'} className="cursor-pointer px-3 py-1">{children}</Badge>
    </button>
  );
}

function StudentDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const detail = useStudentDetail(id);
  const s = detail.data?.student;

  return (
    <Dialog open={!!id} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {!s ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{s.fullName}</DialogTitle>
              <DialogDescription>
                {[s.rollNumber, s.department && DEPARTMENT_NAMES[s.department], s.year].filter(Boolean).join(' · ')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Info label="CGPA" value={s.cgpa ?? '—'} />
              <Info label="Backlogs" value={s.activeBacklogs} />
              <Info label="Email" value={s.email} />
              <Info label="Phone" value={s.phone ?? '—'} />
            </div>
            <div className="flex flex-wrap gap-3">
              {s.resume?.fileId && (
                <Button variant="outline" size="sm" asChild>
                  <a href={resumeUrl(s.id)} target="_blank" rel="noopener noreferrer"><FileText size={14} className="mr-1" /> Resume</a>
                </Button>
              )}
              {Object.entries(s.links ?? {}).filter(([, v]) => v).map(([k, v]) => (
                <a key={k} href={v} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm capitalize text-primary hover:underline">
                  {k} <ExternalLink size={12} />
                </a>
              ))}
            </div>
            {s.skills.length > 0 && (
              <section>
                <h3 className="mb-2 text-sm font-medium">Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {s.skills.map((sk) => <Badge key={sk.name} variant="outline" className="font-normal">{sk.name} · {sk.level}</Badge>)}
                </div>
              </section>
            )}
            {s.projects.length > 0 && (
              <section>
                <h3 className="mb-2 text-sm font-medium">Projects</h3>
                <ul className="space-y-1 text-sm">
                  {s.projects.map((p) => <li key={p.title}><span className="font-medium">{p.title}</span>{p.technologies.length ? ` · ${p.technologies.join(', ')}` : ''}</li>)}
                </ul>
              </section>
            )}
            <section>
              <h3 className="mb-2 text-sm font-medium">Applications</h3>
              {detail.data!.applications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No applications yet.</p>
              ) : (
                <ul className="divide-y rounded-md border text-sm">
                  {detail.data!.applications.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2 p-2">
                      <span>{a.job?.role ?? 'Job removed'}{a.job?.company ? ` · ${a.job.company.name}` : ''}</span>
                      <StatusBadge status={a.status} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-md bg-muted/60 p-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate font-medium" title={String(value)}>{value}</p>
    </div>
  );
}
