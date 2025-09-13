import { AuthService } from "@/features/auth/services/AuthService";
import type { APIRoute } from "astro";
import { z } from "zod";

const schema = z.object({
  username: z.string(),
  password: z.string(),
  fullName: z.string().optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
});

export const POST: APIRoute = async ({ request, redirect }) => {
  const body = await request.json();
  const input = schema.parse(body);

  const service = new AuthService();
  const result = await service.register(
    input.username,
    input.password,
    input.fullName,
    input.email,
    input.avatarUrl,
  );

  if (!result.success) {
    return new Response(
      JSON.stringify({ success: false, message: result.message }),
      {
        status: 400,
      },
    );
  }

  return redirect("/login");
};
