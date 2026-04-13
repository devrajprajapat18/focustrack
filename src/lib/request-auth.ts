import { type NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { apiError } from "@/lib/api";

export async function requireRequestUser(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return { error: apiError("Unauthorized", 401) };
  }

  return { session };
}
