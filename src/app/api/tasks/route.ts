import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api";
import { requireRequestUser } from "@/lib/request-auth";
import { taskSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const auth = await requireRequestUser(request);
  if ("error" in auth) {
    return auth.error;
  }

  const tasks = await prisma.task.findMany({
    where: { userId: auth.session.id },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return apiSuccess(tasks);
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRequestUser(request);
    if ("error" in auth) {
      return auth.error;
    }

    const body = taskSchema.parse(await request.json());

    const maxOrder = await prisma.task.aggregate({
      where: { userId: auth.session.id },
      _max: { order: true },
    });

    const task = await prisma.task.create({
      data: {
        ...body,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        order: body.order ?? (maxOrder._max.order ?? 0) + 1,
        userId: auth.session.id,
      },
    });

    return apiSuccess(task, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
