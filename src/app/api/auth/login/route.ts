import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess, handleApiError } from "@/lib/api";
import { loginSchema } from "@/lib/validators";
import { getAuthCookie, signUserToken } from "@/lib/auth";
import { updateLoginStreak } from "@/lib/streak";

export async function POST(request: NextRequest) {
  try {
    const body = loginSchema.parse(await request.json());

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      return apiError("Invalid credentials", 401);
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      return apiError("Invalid credentials", 401);
    }

    await updateLoginStreak(user.id);

    const session = { id: user.id, email: user.email, name: user.name };
    const token = await signUserToken(session);
    const cookie = getAuthCookie(token);

    const response = apiSuccess(session);
    response.cookies.set(cookie.name, cookie.value, cookie.options);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
