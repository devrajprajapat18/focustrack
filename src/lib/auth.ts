import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { type NextRequest } from "next/server";
import type { UserSession } from "@/lib/types";

const TOKEN_COOKIE = "focustrack_token";
const TOKEN_AGE_SECONDS = 60 * 60 * 24 * 7;

function getSecret(): Uint8Array {
  const value = process.env.JWT_SECRET;
  if (!value || value === "change-this-in-production" || value === "fallback-secret") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET must be set to a strong random value in production.");
    }
    // Dev-only fallback so `next build` / local dev works without env.
    // Never use this value in production.
    return new TextEncoder().encode("dev-only-insecure-secret-do-not-use-in-prod");
  }
  return new TextEncoder().encode(value);
}

export async function signUserToken(session: UserSession) {
  return new SignJWT({
    id: session.id,
    email: session.email,
    name: session.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifyUserToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());

    return {
      id: String(payload.id),
      email: String(payload.email),
      name: String(payload.name),
    };
  } catch {
    return null;
  }
}

export async function getSessionFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifyUserToken(token);
}

export function getSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) {
    return null;
  }

  return verifyUserToken(token);
}

export function getAuthCookie(token: string) {
  return {
    name: TOKEN_COOKIE,
    value: token,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: TOKEN_AGE_SECONDS,
    },
  };
}

export function clearAuthCookie() {
  return {
    name: TOKEN_COOKIE,
    value: "",
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    },
  };
}
