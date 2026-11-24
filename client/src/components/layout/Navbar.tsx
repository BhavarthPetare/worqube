import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { homeFor, useAuth } from '@/context/auth';
import logo from '@/logo/logo.png';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="" className="h-8 w-auto" />
          <span className="text-xl font-bold">Worqube</span>
        </Link>

        <nav className="hidden space-x-6 md:flex" aria-label="Main">
          <a href="#how-it-works" className="text-foreground/80 transition-colors hover:text-primary">How it works</a>
          <a href="https://pict.edu" target="_blank" rel="noopener noreferrer" className="text-foreground/80 transition-colors hover:text-primary">
            PICT
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost">
                <Link to={homeFor(user)}>Dashboard</Link>
              </Button>
              <Button variant="outline" onClick={logout}>Log out</Button>
            </>
          ) : (
            <Button asChild>
              <Link to="/login">Log in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
