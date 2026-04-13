import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api";
import { requireRequestUser } from "@/lib/request-auth";

export async function GET(request: NextRequest) {
  const auth = await requireRequestUser(request);
  if ("error" in auth) {
    return auth.error;
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: auth.session.id },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  return apiSuccess(notifications);
}
