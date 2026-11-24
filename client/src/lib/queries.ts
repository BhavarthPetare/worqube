import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { ApplicationStatus } from './constants';
import type { Applicant, Job, MyApplication, PublicStats, StudentSummary, User } from './types';

// ---- Jobs ------------------------------------------------------------------
export const useJobs = () =>
  useQuery({ queryKey: ['jobs'], queryFn: () => api<{ jobs: Job[] }>('/jobs').then((r) => r.jobs) });

export const useApplyToJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => api(`/jobs/${jobId}/apply`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['my-applications'] });
    },
  });
};

export type JobInput = {
  companyName: string;
  role: string;
  description: string;
  location?: string;
  type: Job['type'];
  salaryRange?: string;
  requiredSkills: string[];
  eligibility: Job['eligibility'];
  deadline?: string | null;
  isActive: boolean;
};

export const useSaveJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: JobInput }) =>
      api<{ job: Job }>(id ? `/jobs/${id}` : '/jobs', { method: id ? 'PUT' : 'POST', body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

export const useSetJobActive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api(`/jobs/${id}/status`, { method: 'PATCH', body: { isActive } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
};

export const useDeleteJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/jobs/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

// ---- Applications ----------------------------------------------------------
export const useMyApplications = () =>
  useQuery({
    queryKey: ['my-applications'],
    queryFn: () => api<{ applications: MyApplication[] }>('/applications/mine').then((r) => r.applications),
  });

export const useWithdrawApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/applications/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-applications'] });
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

export const useApplicants = (jobId: string | null) =>
  useQuery({
    queryKey: ['applicants', jobId],
    enabled: !!jobId,
    queryFn: () => api<{ applications: Applicant[] }>(`/jobs/${jobId}/applicants`).then((r) => r.applications),
  });

export const useUpdateApplicationStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      api(`/applications/${id}`, { method: 'PATCH', body: { status } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applicants'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      qc.invalidateQueries({ queryKey: ['student'] });
    },
  });
};

// ---- Admin -----------------------------------------------------------------
export interface StudentFilters {
  q?: string;
  departments?: string[];
  years?: string[];
  minCgpa?: string;
  maxCgpa?: string;
}

export const useStudents = (filters: StudentFilters) =>
  useQuery({
    queryKey: ['students', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.q) params.set('q', filters.q);
      if (filters.departments?.length) params.set('departments', filters.departments.join(','));
      if (filters.years?.length) params.set('years', filters.years.join(','));
      if (filters.minCgpa) params.set('minCgpa', filters.minCgpa);
      if (filters.maxCgpa) params.set('maxCgpa', filters.maxCgpa);
      return api<{ students: StudentSummary[] }>(`/admin/students?${params}`).then((r) => r.students);
    },
    placeholderData: (previous) => previous,
  });

export type StudentApplication = MyApplication;

export const useStudentDetail = (id: string | null) =>
  useQuery({
    queryKey: ['student', id],
    enabled: !!id,
    queryFn: () => api<{ student: User; applications: StudentApplication[] }>(`/admin/students/${id}`),
  });

export interface Analytics {
  totals: {
    students: number;
    companies: number;
    jobs: number;
    activeJobs: number;
    applications: number;
    offers: number;
    placedStudents: number;
  };
  applicationsByStatus: Partial<Record<ApplicationStatus, number>>;
  departments: { department: string; students: number; placed: number }[];
  topJobs: { role: string; company: string; applicants: number }[];
}

export const useAnalytics = () =>
  useQuery({ queryKey: ['analytics'], queryFn: () => api<Analytics>('/admin/analytics') });

// ---- Public ----------------------------------------------------------------
export const usePublicStats = () =>
  useQuery({ queryKey: ['public-stats'], queryFn: () => api<PublicStats>('/stats'), staleTime: 60_000 });

// Resumes are served by the API behind the session cookie, so a plain link works.
export const resumeUrl = (studentId?: string) =>
  studentId ? `/api/admin/students/${studentId}/resume` : '/api/profile/resume';
