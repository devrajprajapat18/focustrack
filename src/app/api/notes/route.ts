import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api";
import { requireRequestUser } from "@/lib/request-auth";
import { noteSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const auth = await requireRequestUser(request);
  if ("error" in auth) {
    return auth.error;
  }

  const notes = await prisma.note.findMany({
    where: { userId: auth.session.id },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });

  return apiSuccess(notes);
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
        ...body,
        tags: body.tags || [],
        userId: auth.session.id,
      },
    });

    return apiSuccess(note, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
