import { prisma } from "@/lib/prisma";

export async function updateLoginStreak(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return;
  }

  const now = new Date();
  const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;

  if (!lastActive) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastActiveDate: now,
        loginStreak: 1,
        longestStreak: Math.max(user.longestStreak, 1),
      },
    });
    return;
  }

  const dayDiff = Math.floor(
    (new Date(now.toDateString()).getTime() - new Date(lastActive.toDateString()).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  if (dayDiff <= 0) {
    return;
  }

  if (dayDiff === 1) {
    const nextStreak = user.loginStreak + 1;
    await prisma.user.update({
      where: { id: userId },
      data: {
        loginStreak: nextStreak,
        longestStreak: Math.max(user.longestStreak, nextStreak),
        lastActiveDate: now,
      },
    });
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      loginStreak: 1,
      lastActiveDate: now,
    },
  });
}
