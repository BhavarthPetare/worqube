import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { errorMessage } from '@/lib/api';
import { useMyApplications, useWithdrawApplication } from '@/lib/queries';
import StatusBadge from './StatusBadge';

const MyApplications = ({ onBrowseJobs }: { onBrowseJobs: () => void }) => {
  const { toast } = useToast();
  const applications = useMyApplications();
  const withdraw = useWithdrawApplication();

  if (applications.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }
  if (applications.isError) {
    return <p className="py-20 text-center text-destructive">{errorMessage(applications.error)}</p>;
  }

  const rows = applications.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My applications</h1>
        <p className="text-muted-foreground">Track where each application stands. The placement cell updates statuses.</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="mb-4 text-muted-foreground">You haven't applied to any jobs yet.</p>
          <Button onClick={onBrowseJobs}>Browse openings</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((application) => (
            <Card key={application.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{application.job?.role ?? 'Job removed'}</p>
                  <p className="text-sm text-muted-foreground">
                    {[application.job?.company?.name, application.job?.location, `Applied ${format(new Date(application.createdAt), 'd MMM yyyy')}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <StatusBadge status={application.status} />
                {application.status === 'applied' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    disabled={withdraw.isPending}
                    onClick={() =>
                      withdraw.mutate(application.id, {
                        onSuccess: () => toast({ title: 'Application withdrawn' }),
                        onError: (error) => toast({ title: 'Could not withdraw', description: errorMessage(error), variant: 'destructive' }),
                      })
                    }
                  >
                    Withdraw
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyApplications;
