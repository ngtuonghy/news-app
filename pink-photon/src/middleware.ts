import type { MiddlewareHandler } from "astro";
import { sequence } from "astro:middleware";
import { AuthService } from "./features/auth/services/AuthService";
import { parseCookie } from "./features/auth/utils/parseCookie";
import { request } from "http";

// const validation: MiddlewareHandler = async ({ request }, next) => {
//   console.log("validation request");
//   const response = await next();
//   console.log("validation response");
//   return response;
// };
//
//
export const auth: MiddlewareHandler = async ({ request, locals }, next) => {
  const cookies = parseCookie(request.headers.get("cookie"));
  const authService = new AuthService();

  let clearCookies: string[] = [];

  if (cookies["n-user-id"] && cookies["_session-id"]) {
    const user = await authService.getUser(
      cookies["n-user-id"],
      cookies["_session-id"],
    );
    if (!user) {
      locals.user = null;
      clearCookies.push(
        "n-user-id=; HttpOnly; Path=/; Max-Age=0",
        "_session-id=; HttpOnly; Path=/; Max-Age=0",
      );
    } else {
      locals.user = user;
    }
  } else {
    locals.user = null;
  }

  const response = await next();

  if (clearCookies.length > 0) {
    clearCookies.forEach((c) => response.headers.append("Set-Cookie", c));
  }
  return response;
};

export const protectedRoute: MiddlewareHandler = async (
  { request, locals, redirect },
  next,
) => {
  const { pathname } = new URL(request.url);

  if (pathname.startsWith("/m")) {
    if (locals.user?.role !== "reporter") {
      console.log("Unauthorized access to /m route");
      return redirect("/");
    }
  }
  return next();
};

export const onRequest = sequence(auth, protectedRoute);
