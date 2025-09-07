import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Check if demo user is authenticated via new localStorage system
  const demoUser = localStorage.getItem('demo_user');
  const isDemoUser = !!demoUser;
  
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add demo session header for authentication
  if (isDemoUser) {
    const demoSession = localStorage.getItem('demo_session');
    if (demoSession) {
      headers["x-demo-session"] = demoSession;
    }
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Check if demo user is authenticated via new localStorage system
    const demoUser = localStorage.getItem('demo_user');
    const isDemoUser = !!demoUser;
    
    const headers: Record<string, string> = {};
    
    // Add demo session header for authentication
    if (isDemoUser) {
      const demoSession = localStorage.getItem('demo_session');
      if (demoSession) {
        headers["x-demo-session"] = demoSession;
      }
    }
    
    // Construct URL with query parameters properly
    let url = queryKey[0] as string;
    if (queryKey.length > 1 && typeof queryKey[1] === 'object' && queryKey[1] !== null) {
      const params = new URLSearchParams();
      const queryParams = queryKey[1] as Record<string, string>;
      for (const [key, value] of Object.entries(queryParams)) {
        params.append(key, value);
      }
      url += '?' + params.toString();
    } else if (queryKey.length > 1) {
      // Handle path parameters (like /api/messages/conversationId)
      url = queryKey.join("/");
    }
    
    const res = await fetch(url, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
