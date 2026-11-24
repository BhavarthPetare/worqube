// Shapes returned by the Worqube API (server/src/models).
import type { ApplicationStatus, Department, JobType, Year } from './constants';

export interface Skill { id?: string; name: string; level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' }
export interface Project { id?: string; title: string; description?: string; technologies: string[]; githubUrl?: string; projectUrl?: string }
export interface Experience { id?: string; company: string; role: string; location?: string; description?: string; startDate?: string; endDate?: string; current: boolean }
export interface Certification { id?: string; name: string; issuer?: string; issueDate?: string; credentialUrl?: string }

export interface User {
  id: string;
  email: string;
  role: 'student' | 'admin';
  fullName: string;
  rollNumber?: string;
  phone?: string;
  department?: Department;
  year?: Year;
  cgpa?: number;
  activeBacklogs: number;
  links?: { github?: string; linkedin?: string; leetcode?: string; codechef?: string };
  skills: Skill[];
  projects: Project[];
  experience: Experience[];
  certifications: Certification[];
  resume?: { fileId: string; fileName: string; size: number; uploadedAt: string };
  createdAt: string;
}

export interface Company { id: string; name: string; website?: string }

export interface Eligibility { minCgpa: number; branches: Department[]; maxBacklogs: number }

export interface Job {
  id: string;
  company: Company;
  role: string;
  description: string;
  location?: string;
  type: JobType;
  salaryRange?: string;
  requiredSkills: string[];
  eligibility: Eligibility;
  deadline?: string;
  isActive: boolean;
  createdAt: string;
  // Student view only
  myStatus?: ApplicationStatus | null;
  eligibilityCheck?: { eligible: boolean; reasons: string[] };
  // Admin view only
  applicantCount?: number;
}

export interface Application {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MyApplication extends Application {
  job: Pick<Job, 'id' | 'role' | 'location' | 'type' | 'salaryRange' | 'deadline'> & { company: Pick<Company, 'name'> } | null;
}

export type StudentSummary = Pick<User, 'id' | 'fullName' | 'email' | 'rollNumber' | 'department' | 'year' | 'cgpa' | 'activeBacklogs' | 'resume' | 'createdAt'>;

export interface Applicant extends Application {
  student: StudentSummary;
}

export interface PublicStats { students: number; companies: number; activeJobs: number; offers: number; recruiters: string[] }
