import { clearAuthCookie } from "@/lib/auth";
import { apiSuccess } from "@/lib/api";

export async function POST() {
  const response = apiSuccess({ ok: true });
  const cookie = clearAuthCookie();
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
