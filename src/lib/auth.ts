import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { type NextRequest } from "next/server";
import type { UserSession } from "@/lib/types";

const TOKEN_COOKIE = "focustrack_token";
const TOKEN_AGE_SECONDS = 60 * 60 * 24 * 7;

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

export async function signUserToken(session: UserSession) {
  return new SignJWT({
    id: session.id,
    email: session.email,
    name: session.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_AGE_SECONDS}s`)
    .sign(secret);
}

export async function verifyUserToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret);

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
