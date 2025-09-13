import { ArticleManagementRepository } from "@/features/article-management/repository/ArticleManagementRepository";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url, locals }) => {
  const page = Number(url.searchParams.get("page") || 1);
  const perPage = Number(url.searchParams.get("perPage") || 20);
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const repo = new ArticleManagementRepository();
  const articles = await repo.findAllByUser(
    user.id,
    perPage,
    (page - 1) * perPage,
  );

  return new Response(
    JSON.stringify({
      articles,
      page,
      perPage,
      totalCount: articles.length, // hoặc query count riêng
      totalPages: Math.ceil(articles.length / perPage),
    }),
    { headers: { "Content-Type": "application/json" } },
  );
};
