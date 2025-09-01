import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    enabled: false, // Disable automatic query execution
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    retry: false,
  });

  // For now, since auth is disabled, return not authenticated
  return {
    user: null,
    isLoading: false,
    isAuthenticated: false,
  };
}
