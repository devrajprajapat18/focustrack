import { redirect } from "next/navigation";
import { getSessionFromCookie } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

export default async function MainAppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionFromCookie();

  if (!session) {
    redirect("/login");
  }

  return <AppShell>{children}</AppShell>;
}
