import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess, handleApiError } from "@/lib/api";
import { requireRequestUser } from "@/lib/request-auth";
import { taskSchema } from "@/lib/validators";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRequestUser(request);
    if ("error" in auth) {
      return auth.error;
    }

    const { id } = await params;
    const body = taskSchema.partial().parse(await request.json());

    const exists = await prisma.task.findFirst({ where: { id, userId: auth.session.id } });
    if (!exists) {
      return apiError("Task not found", 404);
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...body,
        dueDate: body.dueDate ? new Date(body.dueDate) : body.dueDate === null ? null : undefined,
        completedAt: body.completed === true ? new Date() : body.completed === false ? null : undefined,
      },
    });

    return apiSuccess(task);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRequestUser(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await params;
  const exists = await prisma.task.findFirst({ where: { id, userId: auth.session.id } });
  if (!exists) {
    return apiError("Task not found", 404);
  }

  await prisma.task.delete({ where: { id } });

  return apiSuccess({ ok: true });
}
