import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api";
import { requireRequestUser } from "@/lib/request-auth";
import { noteSchema } from "@/lib/validators";
import { parseNoteTags, serializeNoteTags } from "@/lib/note-tags";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRequestUser(request);
    if ("error" in auth) {
      return auth.error;
    }

    const limit = Math.min(
      Math.max(Number(request.nextUrl.searchParams.get("limit")) || 200, 1),
      500,
    );

    const notes = await prisma.note.findMany({
      where: { userId: auth.session.id },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      take: limit,
    });

    return apiSuccess(notes.map((note) => ({ ...note, tags: parseNoteTags(note.tags) })));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRequestUser(request);
    if ("error" in auth) {
      return auth.error;
    }

    const body = noteSchema.parse(await request.json());

    const note = await prisma.note.create({
      data: {
        title: body.title,
        content: body.content,
        tags: serializeNoteTags(body.tags),
        pinned: body.pinned ?? false,
        userId: auth.session.id,
      },
    });

    return apiSuccess({ ...note, tags: parseNoteTags(note.tags) }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
