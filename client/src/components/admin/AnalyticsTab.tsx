import { Loader2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { errorMessage } from '@/lib/api';
import { APPLICATION_STATUSES, STATUS_LABELS } from '@/lib/constants';
import { useAnalytics } from '@/lib/queries';

const STATUS_COLORS: Record<string, string> = {
  applied: '#3b82f6',
  shortlisted: '#f59e0b',
  rejected: '#94a3b8',
  selected: '#16a34a',
};

export default function AnalyticsTab() {
  const { data, isLoading, isError, error } = useAnalytics();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }
  if (isError || !data) return <p className="py-20 text-center text-destructive">{errorMessage(error)}</p>;

  const { totals } = data;
  const placementRate = totals.students ? Math.round((totals.placedStudents / totals.students) * 100) : 0;
  const statusData = APPLICATION_STATUSES.map((s) => ({ name: STATUS_LABELS[s], key: s, value: data.applicationsByStatus[s] ?? 0 })).filter((d) => d.value > 0);

  const stats = [
    { label: 'Registered students', value: totals.students },
    { label: 'Open jobs', value: `${totals.activeJobs} / ${totals.jobs}` },
    { label: 'Applications', value: totals.applications },
    { label: 'Offers made', value: totals.offers },
    { label: 'Students placed', value: `${totals.placedStudents} (${placementRate}%)` },
    { label: 'Companies', value: totals.companies },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Placement overview</h1>
        <p className="text-muted-foreground">Live numbers from Worqube.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Students and placements by department</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.departments}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="department" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" name="Students" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                <Bar dataKey="placed" name="Placed" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Application outcomes</CardTitle></CardHeader>
          <CardContent className="h-72">
            {statusData.length === 0 ? (
              <p className="pt-24 text-center text-sm text-muted-foreground">No applications yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                    {statusData.map((d) => <Cell key={d.key} fill={STATUS_COLORS[d.key]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Most applied-to jobs</CardTitle></CardHeader>
        <CardContent>
          {data.topJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No applications yet.</p>
          ) : (
            <ul className="divide-y">
              {data.topJobs.map((job) => (
                <li key={`${job.company}-${job.role}`} className="flex items-center justify-between py-2 text-sm">
                  <span><span className="font-medium">{job.role}</span> · {job.company}</span>
                  <span className="text-muted-foreground">{job.applicants} applicants</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
