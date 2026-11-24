import { useState, type ReactNode } from 'react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth';
import { api, errorMessage } from '@/lib/api';
import type { User } from '@/lib/types';

export type FieldType = 'text' | 'textarea' | 'url' | 'month' | 'tags' | 'select' | 'checkbox';

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: readonly string[];
  placeholder?: string;
}

type Item = Record<string, unknown> & { id?: string };
type Section = 'skills' | 'projects' | 'experience' | 'certifications';

interface SectionEditorProps {
  section: Section;
  title: string;
  description: string;
  fields: FieldConfig[];
  empty: string;
  renderItem: (item: Item) => ReactNode;
}

const blank = (fields: FieldConfig[]): Item =>
  Object.fromEntries(
    fields.map((f) => [f.key, f.type === 'tags' ? [] : f.type === 'checkbox' ? false : f.type === 'select' ? f.options?.[1] ?? f.options?.[0] : '']),
  );

// Edits one list on the student profile (skills, projects, ...). Changes are saved by
// sending the whole list to PUT /api/profile/:section; the server validates it.
export default function SectionEditor({ section, title, description, fields, empty, renderItem }: SectionEditorProps) {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState<{ index: number | null; item: Item } | null>(null);
  const [saving, setSaving] = useState(false);

  const items = ((user?.[section] ?? []) as unknown) as Item[];

  const save = async (next: Item[]) => {
    setSaving(true);
    try {
      // Strip ids and empty strings; the server assigns ids.
      const payload = next.map(({ id: _id, ...rest }) =>
        Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== '' && v !== undefined)),
      );
      const { user: updated } = await api<{ user: User }>(`/profile/${section}`, { method: 'PUT', body: payload });
      setUser(updated);
      return true;
    } catch (err) {
      toast({ title: 'Could not save', description: errorMessage(err), variant: 'destructive' });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    if (!editing) return;
    const missing = fields.find((f) => f.required && !String(editing.item[f.key] ?? '').trim());
    if (missing) {
      toast({ title: `${missing.label} is required`, variant: 'destructive' });
      return;
    }
    const next = [...items];
    if (editing.index === null) next.push(editing.item);
    else next[editing.index] = editing.item;
    if (await save(next)) setEditing(null);
  };

  const remove = (index: number) => save(items.filter((_, i) => i !== index));

  const setField = (key: string, value: unknown) =>
    setEditing((e) => (e ? { ...e, item: { ...e.item, [key]: value } } : e));

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button size="sm" onClick={() => setEditing({ index: null, item: blank(fields) })}>
          <Plus size={16} className="mr-1" /> Add
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {items.map((item, index) => (
            <li key={item.id ?? index} className="flex items-start gap-3 p-4">
              <div className="min-w-0 flex-1">{renderItem(item)}</div>
              <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => setEditing({ index, item: { ...item } })}>
                <Pencil size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete"
                className="text-muted-foreground hover:text-destructive"
                disabled={saving}
                onClick={() => remove(index)}
              >
                <Trash2 size={16} />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.index === null ? `Add to ${title.toLowerCase()}` : `Edit ${title.toLowerCase()}`}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              {fields.map((field) => (
                <FieldInput key={field.key} field={field} value={editing.item[field.key]} onChange={(v) => setField(field.key, v)} />
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={submit} disabled={saving}>
              {saving && <Loader2 size={16} className="mr-2 animate-spin" />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function FieldInput({ field, value, onChange }: { field: FieldConfig; value: unknown; onChange: (v: unknown) => void }) {
  const id = `field-${field.key}`;
  const label = `${field.label}${field.required ? ' *' : ''}`;

  if (field.type === 'checkbox') {
    return (
      <div className="flex items-center gap-2">
        <Checkbox id={id} checked={!!value} onCheckedChange={(c) => onChange(c === true)} />
        <Label htmlFor={id}>{field.label}</Label>
      </div>
    );
  }
  if (field.type === 'select') {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <Select value={String(value ?? '')} onValueChange={onChange}>
          <SelectTrigger id={id}><SelectValue /></SelectTrigger>
          <SelectContent>
            {field.options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );
  }
  if (field.type === 'textarea') {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <Textarea id={id} rows={4} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  if (field.type === 'tags') {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          placeholder={field.placeholder ?? 'Comma-separated'}
          defaultValue={((value as string[]) ?? []).join(', ')}
          onChange={(e) => onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
        />
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={field.type === 'month' ? 'month' : field.type === 'url' ? 'url' : 'text'}
        placeholder={field.placeholder ?? (field.type === 'url' ? 'https://' : undefined)}
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
