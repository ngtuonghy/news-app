import type { APIRoute } from "astro";
import { ArticleManagementService } from "@/features/article-management/services/ArticleManagementService";

export const PUT: APIRoute = async ({ params, request }) => {
  const id = params.id;
  const body = await request.json();

  const articleService = new ArticleManagementService();
  const updated = await articleService.updateArticle(id, body);
  if(!updated) {
    return new Response(JSON.stringify({ message: "Article not found" }), { status: 404 });
  }
  return new Response(JSON.stringify({
    message: "Article updated successfully",
    status: "success",
  }), { status: 200 });

 
};
