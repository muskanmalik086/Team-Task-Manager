import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 }
  }
});

// Override the global fetch to include JWT token
const originalFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  const token = localStorage.getItem("ttm_token");
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return originalFetch(input, { ...init, headers });
};
