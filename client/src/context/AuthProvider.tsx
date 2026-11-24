import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import type { User } from '@/lib/types';
import { AuthContext } from './auth';

// The session lives in an httpOnly cookie; on load we ask the API who we are.
// The role used for routing always comes from the server.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    api<{ user: User }>('/auth/me')
      .then((r) => setUser(r.user))
      .catch((err) => {
        if (!(err instanceof ApiError && err.status === 401)) console.error(err);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { user } = await api<{ user: User }>('/auth/login', { method: 'POST', body: { email, password } });
      queryClient.clear();
      setUser(user);
      return user;
    },
    [queryClient],
  );

  const register = useCallback(
    async (fullName: string, email: string, password: string) => {
      const { user } = await api<{ user: User }>('/auth/register', {
        method: 'POST',
        body: { fullName, email, password },
      });
      queryClient.clear();
      setUser(user);
      return user;
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout, setUser }),
    [user, isLoading, login, register, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
