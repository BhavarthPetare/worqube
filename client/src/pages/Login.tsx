import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthForm, { type AuthFormData } from '@/components/ui/AuthForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { homeFor, useAuth } from '@/context/auth';
import { errorMessage } from '@/lib/api';
import logo from '@/logo/logo.png';

const Login = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading, login, register } = useAuth();

  // Already signed in: go straight to the right dashboard.
  useEffect(() => {
    if (!isLoading && user) navigate(homeFor(user), { replace: true });
  }, [isLoading, user, navigate]);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await action();
      toast({ title: success });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Self-registration always creates a student. T&P coordinator (admin) accounts
  // are created by the placement cell, so there is no admin sign-up option.
  const handleSignUp = ({ email, password, fullName }: AuthFormData) =>
    run(() => register(fullName ?? '', email, password), 'Account created. Welcome to Worqube!');

  const handleSignIn = ({ email, password }: AuthFormData) => run(() => login(email, password), 'Signed in');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <Link to="/" className="inline-block">
            <img src={logo} alt="Worqube" className="mx-auto h-12 w-auto" />
          </Link>
          <h1 className="text-3xl font-bold">Welcome to Worqube</h1>
          <p className="text-muted-foreground">PICT Training & Placement portal</p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          {error && (
            <div role="alert" className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {error}
            </div>
          )}

          <Tabs defaultValue="login" className="w-full" onValueChange={() => setError(null)}>
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="login">Log in</TabsTrigger>
              <TabsTrigger value="register">Student sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <AuthForm type="login" onSubmit={handleSignIn} isLoading={isSubmitting} />
            </TabsContent>
            <TabsContent value="register">
              <AuthForm type="register" onSubmit={handleSignUp} isLoading={isSubmitting} />
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            T&P coordinators: your account is created by the placement cell. Log in with the credentials you were given.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
