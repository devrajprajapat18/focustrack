import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api";
import { requireRequestUser } from "@/lib/request-auth";
import { pomodoroSessionSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const auth = await requireRequestUser(request);
  if ("error" in auth) {
    return auth.error;
  }

  const sessions = await prisma.pomodoroSession.findMany({
    where: { userId: auth.session.id },
    take: 20,
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(sessions);
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRequestUser(request);
    if ("error" in auth) {
      return auth.error;
    }

    const body = pomodoroSessionSchema.parse(await request.json());

    const session = await prisma.pomodoroSession.create({
      data: {
        mode: body.mode,
        duration: body.duration,
        userId: auth.session.id,
      },
    });

    return apiSuccess(session, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
