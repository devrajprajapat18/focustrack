import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess, handleApiError } from "@/lib/api";
import { registerSchema } from "@/lib/validators";
import { getAuthCookie, signUserToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = registerSchema.parse(await request.json());
    const exists = await prisma.user.findUnique({ where: { email: body.email } });

    if (exists) {
      return apiError("Email already registered", 409);
    }

    const passwordHash = await bcrypt.hash(body.password, 12);

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
      },
      select: { id: true, name: true, email: true },
    });

    const token = await signUserToken(user);
    const cookie = getAuthCookie(token);

    const response = apiSuccess(user, 201);
    response.cookies.set(cookie.name, cookie.value, cookie.options);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
