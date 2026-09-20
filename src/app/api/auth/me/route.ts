import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api";
import { requireRequestUser } from "@/lib/request-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRequestUser(request);
    if ("error" in auth) {
      return auth.error;
    }

    return apiSuccess(auth.session);
  } catch (error) {
    return handleApiError(error);
  }
}
