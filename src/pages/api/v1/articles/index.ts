import { ArticleService } from "@/features/articles/services/ArticleService";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url}) => {
  const page = Number(url.searchParams.get("page") || 1);
  const perPage = Number(url.searchParams.get("perPage") || 20);
  const category = url.searchParams.get("category") || undefined;

  const repo = new ArticleService();
  const articles = await repo.getLatestArticles(
    perPage,
    (page - 1) * perPage,
    category,
  );

  return new Response(
    JSON.stringify({
      data:articles,
      page,
      perPage,
      message: "Latest articles fetched successfully",
      status: "success",
    }),
    { headers: { "Content-Type": "application/json" } },
  );
};

