import { TIMEZONE } from './constants.js';

// Today's date as YYYY-MM-DD in India time. Deadlines are stored the same way and are
// inclusive, so a deadline of 2026-12-01 accepts applications all day on 1 December IST.
export const todayInIndia = (now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(now);

/**
 * Decide whether a student may apply to a job. Single source of truth: the API uses it
 * to accept applications and also returns the result so the UI can explain it.
 * @returns {{ eligible: boolean, reasons: string[] }}
 */
export function checkEligibility(student, job, now = new Date()) {
  const reasons = [];
  const rules = job.eligibility ?? {};
  const minCgpa = rules.minCgpa ?? 0;
  const branches = rules.branches ?? [];
  const maxBacklogs = rules.maxBacklogs ?? 0;

  if (!job.isActive) reasons.push('This job is closed');
  if (job.deadline && job.deadline < todayInIndia(now)) reasons.push('The deadline has passed');

  if (student.cgpa == null || !student.department || !student.year) {
    reasons.push('Complete your profile (department, year and CGPA)');
  } else {
    if (student.cgpa < minCgpa) reasons.push(`Requires CGPA ${minCgpa}+`);
    if (branches.length > 0 && !branches.includes(student.department)) {
      reasons.push(`Open to ${branches.join(', ')} only`);
    }
  }
  if ((student.activeBacklogs ?? 0) > maxBacklogs) {
    reasons.push(`Allows at most ${maxBacklogs} active backlog(s)`);
  }
  if (!student.resume?.fileId) reasons.push('Upload your resume');

  return { eligible: reasons.length === 0, reasons };
}
