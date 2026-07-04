// client/src/hooks/useAuth.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";

export interface AuthUser {
  id: number;
  email: string;
}

export function useAuth() {
  const qc = useQueryClient();

  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["auth/me"],
    queryFn: async () => {
      try {
        return await api.get<AuthUser>("/api/auth/me");
      } catch {
        return null;
      }
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      api.post<AuthUser>("/api/auth/login", { email, password }),
    onSuccess: (data) => {
      qc.setQueryData(["auth/me"], data);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post("/api/auth/logout"),
    onSuccess: () => {
      qc.setQueryData(["auth/me"], null);
      qc.clear();
    },
  });

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: Boolean(user),
    login: loginMutation.mutateAsync,
    loginPending: loginMutation.isPending,
    loginError: loginMutation.error?.message ?? null,
    logout: logoutMutation.mutate,
  };
}
