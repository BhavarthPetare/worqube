// Single source of truth for values shared by forms, filters and the database
// (supabase/migrations: check constraints on profiles and job_listings).

export const DEPARTMENTS = ['CE', 'IT', 'EnTC', 'AIDS', 'ECE'] as const;
export const DEPARTMENT_NAMES: Record<Department, string> = {
  CE: 'Computer Engineering',
  IT: 'Information Technology',
  EnTC: 'Electronics & Telecommunication',
  AIDS: 'AI & Data Science',
  ECE: 'Electronics & Computer Engineering',
};
export type Department = (typeof DEPARTMENTS)[number];

export const YEARS = ['FE', 'SE', 'TE', 'BE'] as const;
export type Year = (typeof YEARS)[number];

export const JOB_TYPES = ['Full-time', 'Internship'] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const APPLICATION_STATUSES = ['applied', 'shortlisted', 'rejected', 'selected'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  shortlisted: 'Shortlisted',
  rejected: 'Not selected',
  selected: 'Selected',
};

export const RESUME_MAX_BYTES = 5 * 1024 * 1024;
