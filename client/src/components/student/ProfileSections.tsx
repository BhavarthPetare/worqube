import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import SectionEditor from './SectionEditor';

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;

const formatMonth = (value: unknown) => {
  if (typeof value !== 'string' || !value) return '';
  const [y, m] = value.split('-').map(Number);
  return new Date(y, m - 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' });
};

const Link = ({ href, label }: { href: unknown; label: string }) =>
  typeof href === 'string' && href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
      {label} <ExternalLink size={12} />
    </a>
  ) : null;

export const SkillsSection = () => (
  <SectionEditor
    section="skills"
    title="Skills"
    description="Technologies and tools you're comfortable with."
    empty="No skills added yet."
    fields={[
      { key: 'name', label: 'Skill', type: 'text', required: true, placeholder: 'e.g. React' },
      { key: 'level', label: 'Level', type: 'select', options: SKILL_LEVELS },
    ]}
    renderItem={(s) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{String(s.name)}</span>
        <Badge variant="secondary">{String(s.level)}</Badge>
      </div>
    )}
  />
);

export const CertificationsSection = () => (
  <SectionEditor
    section="certifications"
    title="Certifications"
    description="Courses and certificates with a verifiable link if you have one."
    empty="No certifications added yet."
    fields={[
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'issuer', label: 'Issuer', type: 'text' },
      { key: 'issueDate', label: 'Issued', type: 'month' },
      { key: 'credentialUrl', label: 'Credential link', type: 'url' },
    ]}
    renderItem={(c) => (
      <div className="space-y-0.5">
        <p className="font-medium">{String(c.name)}</p>
        <p className="text-sm text-muted-foreground">
          {[c.issuer, formatMonth(c.issueDate)].filter(Boolean).join(' · ')}
        </p>
        <Link href={c.credentialUrl} label="View credential" />
      </div>
    )}
  />
);

export const ProjectsSection = () => (
  <SectionEditor
    section="projects"
    title="Projects"
    description="Academic and personal projects that show what you can build."
    empty="No projects added yet."
    fields={[
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'technologies', label: 'Technologies', type: 'tags', placeholder: 'React, Node.js, MongoDB' },
      { key: 'githubUrl', label: 'Source code link', type: 'url' },
      { key: 'projectUrl', label: 'Live demo link', type: 'url' },
    ]}
    renderItem={(p) => (
      <div className="space-y-1.5">
        <p className="font-medium">{String(p.title)}</p>
        {p.description ? <p className="whitespace-pre-line text-sm text-muted-foreground">{String(p.description)}</p> : null}
        <div className="flex flex-wrap gap-1.5">
          {((p.technologies as string[]) ?? []).map((t) => <Badge key={t} variant="outline" className="font-normal">{t}</Badge>)}
        </div>
        <div className="flex gap-4">
          <Link href={p.githubUrl} label="Code" />
          <Link href={p.projectUrl} label="Demo" />
        </div>
      </div>
    )}
  />
);

export const ExperienceSection = () => (
  <SectionEditor
    section="experience"
    title="Experience"
    description="Internships, part-time roles and other work experience."
    empty="No experience added yet."
    fields={[
      { key: 'role', label: 'Role', type: 'text', required: true },
      { key: 'company', label: 'Company', type: 'text', required: true },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'startDate', label: 'Start', type: 'month' },
      { key: 'endDate', label: 'End', type: 'month' },
      { key: 'current', label: 'I currently work here', type: 'checkbox' },
      { key: 'description', label: 'What you did', type: 'textarea' },
    ]}
    renderItem={(e) => (
      <div className="space-y-0.5">
        <p className="font-medium">{String(e.role)} · {String(e.company)}</p>
        <p className="text-sm text-muted-foreground">
          {[e.location, [formatMonth(e.startDate), e.current ? 'Present' : formatMonth(e.endDate)].filter(Boolean).join(' – ')]
            .filter(Boolean)
            .join(' · ')}
        </p>
        {e.description ? <p className="whitespace-pre-line text-sm">{String(e.description)}</p> : null}
      </div>
    )}
  />
);
