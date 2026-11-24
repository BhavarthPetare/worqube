import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BriefcaseIcon, Building2, CheckCircle2, ClipboardCheck, FileCheck, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { homeFor, useAuth } from '@/context/auth';
import { usePublicStats } from '@/lib/queries';

const Index = () => {
  const { user } = useAuth();
  const stats = usePublicStats();
  const value = (n: number | undefined) => (stats.isLoading ? '…' : stats.isError ? '—' : String(n ?? 0));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <section className="page-container pb-16 pt-32 md:pb-20 md:pt-40">
        <div className="mx-auto max-w-3xl space-y-6 text-center">
          <div className="mb-2 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <span className="mr-2 h-2 w-2 rounded-full bg-primary" />
            Training & Placement Cell · PICT, Pune
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
            Your gateway to <span className="text-primary">campus placements</span>
          </h1>
          <p className="mx-auto max-w-2xl text-balance text-lg text-muted-foreground md:text-xl">
            One place for PICT students to build a placement profile, find drives they're eligible for, apply, and track every application.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            <Button asChild size="lg">
              <Link to={user ? homeFor(user) : '/login'}>
                {user ? 'Go to dashboard' : 'Get started'} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#how-it-works">How it works</a>
            </Button>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          <StatCard number={value(stats.data?.activeJobs)} label="Open drives" icon={<BriefcaseIcon className="h-5 w-5 text-primary" />} />
          <StatCard number={value(stats.data?.companies)} label="Recruiting companies" icon={<Building2 className="h-5 w-5 text-primary" />} />
          <StatCard number={value(stats.data?.students)} label="Registered students" icon={<Users className="h-5 w-5 text-primary" />} />
          <StatCard number={value(stats.data?.offers)} label="Offers made" icon={<CheckCircle2 className="h-5 w-5 text-primary" />} />
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">Live numbers from the Worqube database.</p>
      </section>

      <section id="how-it-works" className="scroll-mt-20 bg-gradient-to-br from-muted/50 to-background py-16">
        <div className="page-container">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-semibold">How it works</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">Built around the way PICT's T&P cell runs placement drives.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard icon={<Users size={24} className="text-primary" />} title="1. Build your profile" description="Academic details, skills, projects, experience, certifications and your resume, all in one place." />
            <FeatureCard icon={<ShieldCheck size={24} className="text-primary" />} title="2. See what you qualify for" description="Each drive's CGPA, branch and backlog criteria are checked against your profile automatically." />
            <FeatureCard icon={<FileCheck size={24} className="text-primary" />} title="3. Apply in one click" description="Your latest resume goes with every application. No forms to fill again." />
            <FeatureCard icon={<ClipboardCheck size={24} className="text-primary" />} title="4. Track your status" description="The placement cell shortlists and selects candidates; you see updates on your dashboard." />
          </div>
        </div>
      </section>

      {!!stats.data?.recruiters.length && (
        <section className="bg-background py-16">
          <div className="page-container">
            <div className="mb-10 text-center">
              <h2 className="mb-4 text-3xl font-semibold">Recruiters on Worqube</h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">Companies with drives posted on the portal.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {stats.data.recruiters.map((name) => (
                <span key={name} className="font-semibold text-muted-foreground/80">{name}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-primary/5 py-20">
        <div className="page-container">
          <div className="glass-card mx-auto max-w-3xl p-10 text-center">
            <h2 className="mb-4 text-3xl font-semibold">Ready for placement season?</h2>
            <p className="mb-8 text-muted-foreground">
              Create your student account, complete your profile, and start applying to drives you're eligible for.
            </p>
            <Button asChild size="lg">
              <Link to={user ? homeFor(user) : '/login'}>
                {user ? 'Go to dashboard' : 'Create your account'} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const StatCard = ({ number, label, icon }: { number: string; label: string; icon: ReactNode }) => (
  <div className="glass-card flex items-center p-4 md:p-6">
    <div className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted md:mr-4 md:h-12 md:w-12">{icon}</div>
    <div>
      <div className="text-2xl font-bold">{number}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  </div>
);

const FeatureCard = ({ icon, title, description }: { icon: ReactNode; title: string; description: string }) => (
  <Card className="h-full overflow-hidden">
    <CardHeader>
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">{icon}</div>
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

export default Index;
