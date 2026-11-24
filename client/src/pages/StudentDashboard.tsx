import { useState } from 'react';
import { BriefcaseIcon, ClipboardList, Settings, UserIcon } from 'lucide-react';
import DashboardShell, { type NavEntry } from '@/components/layout/DashboardShell';
import StudentProfile from '@/components/dashboard/StudentProfile';
import JobListings from '@/components/dashboard/JobListings';
import MyApplications from '@/components/student/MyApplications';
import UserSettings from '@/components/dashboard/UserSettings';

type Tab = 'profile' | 'jobs' | 'applications' | 'settings';

const NAV: NavEntry<Tab>[] = [
  { id: 'profile', label: 'My Profile', icon: <UserIcon size={18} /> },
  { id: 'jobs', label: 'Job Openings', icon: <BriefcaseIcon size={18} /> },
  { id: 'applications', label: 'My Applications', icon: <ClipboardList size={18} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
];

const StudentDashboard = () => {
  const [tab, setTab] = useState<Tab>('profile');

  return (
    <DashboardShell<Tab> title="Student" nav={NAV} active={tab} onNavigate={setTab}>
      {tab === 'profile' && <StudentProfile />}
      {tab === 'jobs' && <JobListings onApplied={() => setTab('applications')} />}
      {tab === 'applications' && <MyApplications onBrowseJobs={() => setTab('jobs')} />}
      {tab === 'settings' && <UserSettings />}
    </DashboardShell>
  );
};

export default StudentDashboard;
