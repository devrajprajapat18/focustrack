import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess, handleApiError } from "@/lib/api";
import { requireRequestUser } from "@/lib/request-auth";
import { noteSchema } from "@/lib/validators";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRequestUser(request);
    if ("error" in auth) {
      return auth.error;
    }

    const { id } = await params;
    const body = noteSchema.partial().parse(await request.json());

    const exists = await prisma.note.findFirst({ where: { id, userId: auth.session.id } });
    if (!exists) {
      return apiError("Note not found", 404);
    }

    const note = await prisma.note.update({
      where: { id },
      data: {
        ...body,
        tags: body.tags || undefined,
      },
    });

    return apiSuccess(note);
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
  const exists = await prisma.note.findFirst({ where: { id, userId: auth.session.id } });
  if (!exists) {
    return apiError("Note not found", 404);
  }

  await prisma.note.delete({ where: { id } });

  return apiSuccess({ ok: true });
}
