import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api";
import { requireRequestUser } from "@/lib/request-auth";
import { noteSchema } from "@/lib/validators";

function parseTags(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((tag): tag is string => typeof tag === "string") : [];
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireRequestUser(request);
  if ("error" in auth) {
    return auth.error;
  }

  const notes = await prisma.note.findMany({
    where: { userId: auth.session.id },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });

  return apiSuccess(notes.map((note) => ({ ...note, tags: parseTags(note.tags) })));
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
        tags: JSON.stringify(body.tags || []),
        pinned: body.pinned ?? false,
        userId: auth.session.id,
      },
    });

    return apiSuccess({ ...note, tags: parseTags(note.tags) }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
