import { AuthService } from "@/features/auth/services/AuthService";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const service = new AuthService();

  const token = cookies.get("_session-id")?.value;
  const userId = cookies.get("n-user-id")?.value;

  if (token && userId) {
    await service.removeSession(userId, token);
  }

  cookies.delete("_session-id", { path: "/" });
  cookies.delete("n-user-id", { path: "/" });

  return redirect("/login");
};
