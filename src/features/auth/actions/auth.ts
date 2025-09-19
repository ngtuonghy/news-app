import { defineAction } from "astro:actions";
import { z } from "zod";
import { AuthService } from "../services/AuthService";

export const auth = {
  login: defineAction({
    accept: "form",
    input: z.object({ username: z.string(), password: z.string() }),
    handler: async (input) => {
      const service = new AuthService();
      const username = input.username;
      const password = input.password;
      const result = await service.login(username, password);
      if (result.success && result.user) {
        const token = await service.saveSession(result.user);

        const headers = new Headers();
        headers.append(
          "Set-Cookie",
          `session=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 365}`,
        );
        headers.append(
          "Set-Cookie",
          `userId=${result.user.id}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 365}`,
        );

        return new Response(null, {
          headers,
        });
      } else {
        return { success: false, message: "username or password invalid" };
      }
    },
  }),

  logout: defineAction({
    accept: "json",
    input: z.object({ userId: z.string(), token: z.string() }),
    handler: async (input) => {
      const service = new AuthService();
      await service.removeSession(input.userId, input.token);
      return new Response(null, {
        status: 303, // redirect
        headers: {
          "Set-Cookie": `session_token=; HttpOnly; Path=/; Max-Age=0`,
          Location: "/", // trang muốn redirect
        },
      });
    },
  }),

  register: defineAction({
    accept: "form",
    input: z.object({
      username: z.string(),
      password: z.string(),
      fullName: z.string().optional(),
      email: z.string().email().optional(),
      avatarUrl: z.string().url().optional(),
    }),
    handler: async (input) => {
      const service = new AuthService();
      const result = await service.register(
        input.username,
        input.password,
        input.fullName,
        input.email,
        input.avatarUrl,
      );
      if (result.success) {
        return new Response(null, {
          status: 303, // redirect
          headers: {
            Location: "/login", // trang muốn redirect
          },
        });
      } else {
        return {
          success: false,
          message: result.message || "Registration failed",
        };
      }
    },
  }),
};
