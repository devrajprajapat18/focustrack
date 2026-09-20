import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess, handleApiError } from "@/lib/api";
import { requireRequestUser } from "@/lib/request-auth";
import { noteSchema } from "@/lib/validators";
import { parseNoteTags, serializeNoteTags } from "@/lib/note-tags";

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
        title: body.title,
        content: body.content,
        tags: body.tags ? serializeNoteTags(body.tags) : undefined,
        pinned: body.pinned,
      },
    });

    return apiSuccess({ ...note, tags: parseNoteTags(note.tags) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
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
  } catch (error) {
    return handleApiError(error);
  }
}

// Partial updates are also accepted via PATCH (same semantics as PUT here
// for backwards compatibility with existing clients).
export { PUT as PATCH };
