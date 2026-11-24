import { useState } from 'react';
import { BarChart3Icon, BriefcaseIcon, UsersIcon } from 'lucide-react';
import DashboardShell, { type NavEntry } from '@/components/layout/DashboardShell';
import AnalyticsTab from '@/components/admin/AnalyticsTab';
import StudentsTab from '@/components/admin/StudentsTab';
import JobsTab from '@/components/admin/JobsTab';

type Tab = 'overview' | 'students' | 'jobs';

const NAV: NavEntry<Tab>[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart3Icon size={18} /> },
  { id: 'students', label: 'Students', icon: <UsersIcon size={18} /> },
  { id: 'jobs', label: 'Jobs & applicants', icon: <BriefcaseIcon size={18} /> },
];

const AdminDashboard = () => {
  const [tab, setTab] = useState<Tab>('overview');
  return (
    <DashboardShell<Tab> title="T&P Admin" nav={NAV} active={tab} onNavigate={setTab}>
      {tab === 'overview' && <AnalyticsTab />}
      {tab === 'students' && <StudentsTab />}
      {tab === 'jobs' && <JobsTab />}
    </DashboardShell>
  );
};

export default AdminDashboard;
