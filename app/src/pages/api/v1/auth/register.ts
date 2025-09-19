import { AuthService } from "@/features/auth/services/AuthService";
import type { APIRoute } from "astro";
import { z } from "zod";

const schema = z.object({
  username: z.string(),
  password: z.string(),
  fullName: z.string().optional(),
});

export const POST: APIRoute = async ({ request, redirect }) => {
  const body = await request.json();
  const input = schema.parse(body);

  const service = new AuthService();
  const result = await service.register(
    input.username,
    input.password,
    input.fullName,
  );

   if (result.code === "USERNAME_TAKEN") {
    return new Response(
      JSON.stringify({ success: false, message: "Username already exists", code: "USERNAME_TAKEN" }),
      {
        status: 409,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  if (!result.success) {
    return new Response(
      JSON.stringify({ success: false, message: result.message }),
      {
        status: 400,
      },
    );
  }
  return new Response(JSON.stringify({ success: true , message:"register success"}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
 


};
