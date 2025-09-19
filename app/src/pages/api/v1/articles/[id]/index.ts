import type { APIRoute } from "astro";
import { ArticleManagementService } from "@/features/article-management/services/ArticleManagementService";

export const PUT: APIRoute = async ({ params, request }) => {
	const id = params.id;
	const body = await request.json();

	if (!id || !body) {
		return new Response(
			JSON.stringify({ message: "Invalid request", status: "error" }),
			{ status: 400 },
		);
	}
	const articleService = new ArticleManagementService();
	const updated = await articleService.updateArticle(id, body);
	if (!updated) {
		return new Response(JSON.stringify({ message: "Article not found" }), {
			status: 404,
		});
	}
	return new Response(
		JSON.stringify({
			message: "Article updated successfully",
			status: "success",
		}),
		{ status: 200 },
	);
};

export const DELETE: APIRoute = async ({ params, locals }) => {
	try {
		const articleService = new ArticleManagementService();
		const user = locals.user;
		if (!user) {
			return new Response(
				JSON.stringify({ success: false, message: "Unauthorized" }),
				{
					status: 401,
				},
			);
		}
		await articleService.deleteArticle(params.id!, user.id);
		return new Response(
			JSON.stringify({
				success: true,
				message: "Article deleted successfully",
			}),
			{ status: 200 },
		);
	} catch (error) {
		return new Response(
			JSON.stringify({ success: false, message: "Error deleting article" }),
			{ status: 500 },
		);
	}
};
