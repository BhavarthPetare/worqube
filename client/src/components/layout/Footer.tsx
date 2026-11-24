import { Link } from 'react-router-dom';
import { ExternalLink, Github, Mail, MapPin, Phone } from 'lucide-react';
import logo from '../../logo/logo.png';

const Footer = () => (
  <footer className="border-t border-border bg-secondary pb-8 pt-16">
    <div className="container mx-auto px-4 md:px-6">
      <div className="mb-10 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <img src={logo} alt="Worqube" width={160} height={160} className="h-auto w-40" />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Placement portal for the Training & Placement Cell at Pune Institute of Computer Technology.
          </p>
        </div>

        <div>
          <h4 className="mb-4 font-medium text-foreground">Quick links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="text-muted-foreground transition-colors hover:text-primary">Home</Link></li>
            <li><a href="#how-it-works" className="text-muted-foreground transition-colors hover:text-primary">How it works</a></li>
            <li><Link to="/login" className="text-muted-foreground transition-colors hover:text-primary">Log in / Sign up</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-medium text-foreground">Contact</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start">
              <MapPin className="mr-2 mt-0.5 h-5 w-5 shrink-0 text-primary" />
              Survey No. 27, Near Trimurti Chowk, Bharati Vidyapeeth Campus, Dhankawadi, Pune, Maharashtra 411043
            </li>
            <li className="flex items-center">
              <Phone className="mr-2 h-5 w-5 shrink-0 text-primary" />
              <a href="tel:+919049102636" className="hover:text-primary">+91 9049102636</a>
            </li>
            <li className="flex items-center">
              <Mail className="mr-2 h-5 w-5 shrink-0 text-primary" />
              <a href="mailto:worqubeofficial@gmail.com" className="hover:text-primary">worqubeofficial@gmail.com</a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-medium text-foreground">Resources</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="https://pict.edu" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-muted-foreground transition-colors hover:text-primary">
                PICT official website <ExternalLink className="ml-1 h-3.5 w-3.5" />
              </a>
            </li>
            <li>
              <a href="https://github.com/BhavarthPetare/worqube" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-muted-foreground transition-colors hover:text-primary">
                <Github className="mr-1 h-3.5 w-3.5" /> Source code
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-2 border-t border-border/50 pt-8 text-sm text-muted-foreground md:flex-row">
        <p>© {new Date().getFullYear()} Worqube.</p>
        <p>Built by Bhavarth Petare</p>
      </div>
    </div>
  </footer>
);

export default Footer;
