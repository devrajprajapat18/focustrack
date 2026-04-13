import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return apiError(error.issues.map((issue) => issue.message).join(", "), 422);
  }

  if (error instanceof Error) {
    return apiError(error.message, 500);
  }

  return apiError("Unexpected server error", 500);
}
