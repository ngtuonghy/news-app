import type { MiddlewareHandler } from "astro";
import { sequence } from "astro:middleware";
import { AuthService } from "./features/auth/services/AuthService";
import { parseCookie } from "./features/auth/utils/parseCookie";
import { RateLimiter } from "limiter";


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

export const navRoute: MiddlewareHandler = async (
  { request, locals, redirect },
  next
) => {
  const { pathname } = new URL(request.url);
    if (pathname.startsWith("/api")) {
    return next();
  }

  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") 

  if (!isPublic && !locals.user) {
  }else if(isPublic && locals.user){
    return redirect("/");

  }

  return next();
};



const limiter = new RateLimiter({
	tokensPerInterval: 50,
	interval: "minute",
	fireImmediately: true,
});

export const rateLimit: MiddlewareHandler = async ({ request }, next) => {
	const remainingRequests = await limiter.removeTokens(1);
	if (remainingRequests < 0) {
		return new Response(
			`
<!DOCTYPE html>
  <html lang="vi">
    <head>
      <meta charset="UTF-8" />
      <title>429 Too Many Requests</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="min-h-screen flex items-center justify-center bg-red-100">
      <div class="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md animate-fadeIn">
        <h1 class="text-3xl font-bold text-red-600 mb-4">429 - Quá nhiều yêu cầu</h1>
        <p class="text-gray-700 mb-6">Bạn đã gửi quá nhiều request.<br/>Vui lòng thử lại sau một lúc.</p>
        <a href="/" 
           class="inline-block bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition">
          Quay lại trang chủ
        </a>
      </div>
      <style>
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      </style>
    </body>
  </html>

`,
			{
				status: 429,
				headers: { "Content-Type": "text/html; charset=utf-8" },
			},
		);
	}
	return next();
};

export const onRequest = sequence(rateLimit, auth, navRoute, protectedRoute);

// const WINDOW = 60_000; // 1 phút
// const MAX_REQ = 5;    // mỗi IP tối đa 30 req / phút
//
// const requests = new Map<string, { count: number; timestamp: number }>();
//
// export const rateLimit: MiddlewareHandler = async ({ request, locals }, next) => {
//   const ip = request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "unknown";
//
//   const now = Date.now();
//   const entry = requests.get(ip);
//
//   if (!entry || now - entry.timestamp > WINDOW) {
//     requests.set(ip, { count: 1, timestamp: now });
//   } else {
//     entry.count++;
//     if (entry.count > MAX_REQ) {
//       return new Response(`
// <!DOCTYPE html>
//   <html lang="vi">
//     <head>
//       <meta charset="UTF-8" />
//       <title>429 Too Many Requests</title>
//       <script src="https://cdn.tailwindcss.com"></script>
//     </head>
//     <body class="min-h-screen flex items-center justify-center bg-red-100">
//       <div class="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md animate-fadeIn">
//         <h1 class="text-3xl font-bold text-red-600 mb-4">429 - Quá nhiều yêu cầu</h1>
//         <p class="text-gray-700 mb-6">Bạn đã gửi quá nhiều request.<br/>Vui lòng thử lại sau một lúc.</p>
//         <a href="/"
//            class="inline-block bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition">
//           Quay lại trang chủ
//         </a>
//       </div>
//       <style>
//         @keyframes fadeIn {
//           from { opacity: 0; transform: translateY(-10px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         .animate-fadeIn {
//           animation: fadeIn 0.4s ease-out;
//         }
//       </style>
//     </body>
//   </html>
//
// `, {
//   status: 429,
//   headers: { "Content-Type": "text/html; charset=utf-8" }
// });
//
//     }
//   }
//
//   return next();
// };

