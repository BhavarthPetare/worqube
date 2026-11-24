import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api, errorMessage } from '@/lib/api';

// Settings: change password. (Theme/language/notification preferences were removed:
// nothing used them.)
const UserSettings = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.newPassword.length < 8) return setError('New password must be at least 8 characters');
    if (form.newPassword !== form.confirm) return setError('New passwords do not match');
    setSaving(true);
    try {
      await api('/auth/change-password', {
        method: 'POST',
        body: { currentPassword: form.currentPassword, newPassword: form.newPassword },
      });
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      toast({ title: 'Password changed' });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof typeof form, label: string, autoComplete: string) => (
    <div className="space-y-2">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        type="password"
        autoComplete={autoComplete}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        required
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your account security.</p>
      </div>
      <form onSubmit={submit} className="max-w-md space-y-4 rounded-lg border bg-background p-6">
        <h2 className="text-lg font-medium">Change password</h2>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {field('currentPassword', 'Current password', 'current-password')}
        {field('newPassword', 'New password', 'new-password')}
        {field('confirm', 'Confirm new password', 'new-password')}
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 size={16} className="mr-2 animate-spin" />}Update password
        </Button>
      </form>
    </div>
  );
};

export default UserSettings;
