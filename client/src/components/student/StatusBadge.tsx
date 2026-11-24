import { Badge } from '@/components/ui/badge';
import { STATUS_LABELS, type ApplicationStatus } from '@/lib/constants';

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  applied: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  shortlisted: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  rejected: 'bg-muted text-muted-foreground hover:bg-muted',
  selected: 'bg-green-100 text-green-800 hover:bg-green-100',
};

export default function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <Badge className={STATUS_STYLES[status]}>{STATUS_LABELS[status]}</Badge>;
}
