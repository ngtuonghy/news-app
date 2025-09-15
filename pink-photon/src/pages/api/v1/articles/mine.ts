import { ArticleManagementService } from "@/features/article-management/services/ArticleManagementService";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url, locals }) => {
  const page = Number(url.searchParams.get("page") || 1);
  const perPage = Number(url.searchParams.get("perPage") || 20);
  const category = url.searchParams.get("category") || undefined;
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const repo = new ArticleManagementService();
  const articles = await repo.getManagementArticle(
  user.id,
  perPage,               
  (page - 1) * perPage,  
  category,
);
   return new Response(
    JSON.stringify({
      data: articles,
      page,
      perPage,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
};
