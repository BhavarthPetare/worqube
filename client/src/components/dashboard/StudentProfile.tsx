import { useEffect, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { BriefcaseIcon, CheckCircle2, FileIcon, GithubIcon, GraduationCap, LinkedinIcon, Loader2, SaveIcon, UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth';
import { api, errorMessage } from '@/lib/api';
import { DEPARTMENTS, DEPARTMENT_NAMES, YEARS } from '@/lib/constants';
import type { User } from '@/lib/types';
import ResumeCard from '@/components/student/ResumeCard';
import { CertificationsSection, ExperienceSection, ProjectsSection, SkillsSection } from '@/components/student/ProfileSections';

type LinkKey = 'github' | 'linkedin' | 'leetcode' | 'codechef';

interface FormState {
  fullName: string;
  rollNumber: string;
  phone: string;
  department: string;
  year: string;
  cgpa: string;
  activeBacklogs: string;
  links: Record<LinkKey, string>;
}

const toForm = (u: User): FormState => ({
  fullName: u.fullName ?? '',
  rollNumber: u.rollNumber ?? '',
  phone: u.phone ?? '',
  department: u.department ?? '',
  year: u.year ?? '',
  cgpa: u.cgpa?.toString() ?? '',
  activeBacklogs: String(u.activeBacklogs ?? 0),
  links: {
    github: u.links?.github ?? '',
    linkedin: u.links?.linkedin ?? '',
    leetcode: u.links?.leetcode ?? '',
    codechef: u.links?.codechef ?? '',
  },
});

const LINKS: { key: LinkKey; label: string; icon?: ReactNode }[] = [
  { key: 'github', label: 'GitHub', icon: <GithubIcon size={16} /> },
  { key: 'linkedin', label: 'LinkedIn', icon: <LinkedinIcon size={16} /> },
  { key: 'leetcode', label: 'LeetCode' },
  { key: 'codechef', label: 'CodeChef' },
];

// What's still needed before the student can apply (mirrors the server's checks).
const missingForApplying = (u: User) =>
  [
    !u.department && 'department',
    !u.year && 'year',
    u.cgpa == null && 'CGPA',
    !u.resume?.fileId && 'resume',
  ].filter(Boolean) as string[];

const listOf = (items: string[]) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

const StudentProfile = () => {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState<FormState | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user && !isEditing) setForm(toForm(user));
  }, [user, isEditing]);

  if (!user || !form) return null;

  const set = <K extends keyof FormState>(key: K) => (value: FormState[K]) => setForm({ ...form, [key]: value });
  const setLink = (key: LinkKey) => (value: string) => setForm({ ...form, links: { ...form.links, [key]: value } });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { user: updated } = await api<{ user: User }>('/profile', {
        method: 'PUT',
        body: {
          fullName: form.fullName,
          rollNumber: form.rollNumber || null,
          phone: form.phone || null,
          department: form.department || null,
          year: form.year || null,
          cgpa: form.cgpa === '' ? null : Number(form.cgpa),
          activeBacklogs: Number(form.activeBacklogs) || 0,
          links: form.links,
        },
      });
      setUser(updated);
      setIsEditing(false);
      toast({ title: 'Profile updated' });
    } catch (err) {
      toast({ title: 'Could not save', description: errorMessage(err), variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const initials = user.fullName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My profile</h1>
        <p className="text-muted-foreground">The placement cell sees this information when you apply.</p>
      </div>

      {missingForApplying(user).length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          To apply for jobs, add your <strong>{listOf(missingForApplying(user))}</strong>.
        </div>
      )}

      <div className="flex flex-col gap-6 rounded-lg border bg-background p-6 md:flex-row md:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-medium text-primary">
          {initials || '?'}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-medium">{user.fullName}</h2>
          <p className="font-medium text-primary">{user.rollNumber || 'Roll number not set'}</p>
          <p className="text-muted-foreground">
            {user.department ? DEPARTMENT_NAMES[user.department] : 'Department not set'} · {user.year || 'Year not set'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
              <GraduationCap size={12} className="mr-1" /> CGPA {user.cgpa ?? 'N/A'}
            </span>
            {user.links?.github && (
              <a href={user.links.github} target="_blank" rel="noopener noreferrer" className="flex items-center rounded-full bg-zinc-900 px-2 py-1 text-xs text-white">
                <GithubIcon size={12} className="mr-1" /> GitHub
              </a>
            )}
            {user.links?.linkedin && (
              <a href={user.links.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center rounded-full bg-[#0077B5] px-2 py-1 text-xs text-white">
                <LinkedinIcon size={12} className="mr-1" /> LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>

      <ResumeCard />

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="flex h-auto flex-wrap justify-start bg-muted/50 p-1">
          <TabsTrigger value="basic" className="gap-1.5"><UserIcon size={16} /> Basic info</TabsTrigger>
          <TabsTrigger value="skills" className="gap-1.5"><CheckCircle2 size={16} /> Skills & certifications</TabsTrigger>
          <TabsTrigger value="projects" className="gap-1.5"><FileIcon size={16} /> Projects</TabsTrigger>
          <TabsTrigger value="experience" className="gap-1.5"><BriefcaseIcon size={16} /> Experience</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6 rounded-lg border bg-background p-6">
          <div className="flex justify-end">
            <Button variant={isEditing ? 'outline' : 'default'} onClick={() => setIsEditing(!isEditing)} disabled={isSaving}>
              {isEditing ? 'Cancel' : 'Edit profile'}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field id="fullName" label="Full name" value={form.fullName} onValue={set('fullName')} disabled={!isEditing} />
            <Field id="rollNumber" label="Roll number" value={form.rollNumber} onValue={set('rollNumber')} disabled={!isEditing} />
            <Field id="email" label="Email" value={user.email} onValue={() => {}} disabled />
            <Field id="phone" label="Phone" value={form.phone} onValue={set('phone')} disabled={!isEditing} />
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={form.department} onValueChange={set('department')} disabled={!isEditing}>
                <SelectTrigger id="department"><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d} · {DEPARTMENT_NAMES[d]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Current year</Label>
              <Select value={form.year} onValueChange={set('year')} disabled={!isEditing}>
                <SelectTrigger id="year"><SelectValue placeholder="Select year" /></SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Field id="cgpa" label="CGPA (out of 10)" type="number" step="0.01" min="0" max="10" value={form.cgpa} onValue={set('cgpa')} disabled={!isEditing} />
            <Field id="activeBacklogs" label="Active backlogs" type="number" min="0" value={form.activeBacklogs} onValue={set('activeBacklogs')} disabled={!isEditing} />
          </div>

          <Separator />
          <h3 className="text-lg font-medium">Online profiles</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {LINKS.map(({ key, label, icon }) => (
              <Field key={key} id={key} label={label} icon={icon} placeholder="https://" value={form.links[key]} onValue={setLink(key)} disabled={!isEditing} />
            ))}
          </div>

          {isEditing && (
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 size={16} className="mr-1.5 animate-spin" /> : <SaveIcon size={16} className="mr-1.5" />}
                Save changes
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="skills" className="space-y-8 rounded-lg border bg-background p-6">
          <SkillsSection />
          <Separator />
          <CertificationsSection />
        </TabsContent>
        <TabsContent value="projects" className="rounded-lg border bg-background p-6">
          <ProjectsSection />
        </TabsContent>
        <TabsContent value="experience" className="rounded-lg border bg-background p-6">
          <ExperienceSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  id: string;
  label: string;
  icon?: ReactNode;
  onValue: (value: string) => void;
}

function Field({ id, label, icon, onValue, ...input }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-1.5">{icon}{label}</Label>
      <Input id={id} onChange={(e) => onValue(e.target.value)} {...input} />
    </div>
  );
}

export default StudentProfile;
