import { AuthService } from "@/features/auth/services/AuthService";
import type { APIRoute } from "astro";
import { z } from "zod";

const schema = z.object({
  username: z.string(),
  password: z.string(),
});

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const body = await request.json();
  const input = schema.safeParse(body);

  if (!input.success) {
    return new Response(
      JSON.stringify({ success: false, message: "Invalid input" }),
      {
        status: 400,
      },
    );
  }

  const service = new AuthService();
  const result = await service.login(input.data.username, input.data.password);

  if (!result.success || !result.user) {
    return new Response(
      JSON.stringify({ success: false, message: "Invalid credentials" }),
      {
        status: 401,
      },
    );
  }

  const token = await service.saveSession(result.user);

  cookies.set("_session-id", token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  cookies.set("n-user-id", result.user.id, {
    httpOnly: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
