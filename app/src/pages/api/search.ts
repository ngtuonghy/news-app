import type { APIRoute } from "astro";
import { ArticleService } from "@/features/articles/services/ArticleService";

export const GET: APIRoute = async ({ url }) => {
  const search = url.searchParams.get("q") || "";
  const page = Number(url.searchParams.get("page") || 1);
  const perPage = Number(url.searchParams.get("perPage") || 20);

  const service = new ArticleService();
  const articles = await service.searchArticles(
    search,
    perPage,
    (page - 1) * perPage,
  );

  return new Response(
    JSON.stringify({
      articles,
      page,
      perPage,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
};
