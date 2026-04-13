"use client";

import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
import type { UserSession } from "@/lib/types";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: () => fetcher<UserSession>("/api/auth/me"),
  });
}
