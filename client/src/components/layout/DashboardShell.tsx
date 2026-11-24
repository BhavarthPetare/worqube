import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth';
import { cn } from '@/lib/utils';
import logo from '@/logo/logo.png';

export interface NavEntry<T extends string> {
  id: T;
  label: string;
  icon: ReactNode;
}

interface DashboardShellProps<T extends string> {
  title: string;
  nav: NavEntry<T>[];
  active: T;
  onNavigate: (id: T) => void;
  children: ReactNode;
}

// Sidebar on desktop, collapsible menu on mobile. Shared by the student and admin dashboards.
export default function DashboardShell<T extends string>({
  title,
  nav,
  active,
  onNavigate,
  children,
}: DashboardShellProps<T>) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const navList = (
    <nav className="space-y-1" aria-label={title}>
      {nav.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            onNavigate(item.id);
            setMenuOpen(false);
          }}
          aria-current={active === item.id ? 'page' : undefined}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            active === item.id
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </nav>
  );

  const footer = (
    <div className="space-y-3 border-t p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{user?.fullName || 'Signed in'}</p>
        <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
      </div>
      <Button
        variant="ghost"
        className="w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        onClick={logout}
      >
        <LogOut size={18} className="mr-2" /> Log out
      </Button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r bg-background md:flex">
        <Link to="/" className="flex items-center gap-2 border-b p-4">
          <img src={logo} alt="" className="h-8 w-auto" />
          <span className="text-lg font-semibold">Worqube</span>
        </Link>
        <p className="px-4 pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
        <div className="flex-1 p-3">{navList}</div>
        {footer}
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background p-4 md:hidden">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="" className="h-7 w-auto" />
            <span className="font-semibold">Worqube</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </Button>
        </header>
        {menuOpen && (
          <div className="sticky top-[65px] z-10 border-b bg-background shadow-sm md:hidden">
            <div className="p-3">{navList}</div>
            {footer}
          </div>
        )}

        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
