import { ArticleRepository } from "../repository/ArticleRepository";
import { mapArticleRowToEntity } from "../mapper";
import type { Article } from "../domain/Article";
import { redis } from "@/lib/redis";

export class ArticleService {
	private repo = new ArticleRepository();
	async getLatestArticles(
		limit = 10,
		offset = 0,
		category?: string,
	): Promise<Article[]> {
		const cacheKey = `articles:latest:${category || "all"}:${limit}:${offset}`;

		const cached = await redis.get(cacheKey);
		if (cached) {
			return JSON.parse(cached) as Article[];
		}

		const rows = await this.repo.findBySection(limit, offset, category);
		const result = rows.map(mapArticleRowToEntity);

		await redis.set(cacheKey, JSON.stringify(result), "EX", 120);

		return result;
	}

	async getArticlesByCategorySlug(
		slug: string,
		limit = 10,
	): Promise<Article[]> {
		const cacheKey = `articles:by-category:${slug}:${limit}`;
		const cached = await redis.get(cacheKey);
		if (cached) {
			return JSON.parse(cached) as Article[];
		}
		const rows = await this.repo.findByCategorySlug(slug, limit);
		const result = rows.map(mapArticleRowToEntity);
		await redis.set(cacheKey, JSON.stringify(result), "EX", 120);

		return result;
	}

	async getArticlesTopCategoriesWithArticles(
		limitCategory = 5,
		limitArticles = 5,
	) {
		const cacheKey = `articles:top-categories:${limitCategory}:${limitArticles}`;

		const cached = await redis.get(cacheKey);
		if (cached) {
			return JSON.parse(cached) as {
				slug: string;
				name: string;
				articles: Article[];
			}[];
		}

		const rows = await this.repo.findTopCategoriesWithArticles(
			limitCategory,
			limitArticles,
		);

		const map = new Map<
			string,
			{ slug: string; name: string; articles: Article[] }
		>();

		for (const row of rows) {
			if (!map.has(row.category_slug)) {
				map.set(row.category_slug, {
					slug: row.category_slug,
					name: row.category_name,
					articles: [],
				});
			}

			const category = map.get(row.category_slug)!;

			category.articles.push({
				id: row.article_id,
				title: row.title,
				shortDescription: row.short_description,
				thumbnailUrl: row.thumbnail_url,
				publishedAt: row.published_at,
				author: row.author_name,
				createdAt: row.created_at,
				categories: row.article_categories,
			});
		}

		const result = Array.from(map.values());

		await redis.set(cacheKey, JSON.stringify(result), "EX", 120);

		return result;
	}

	async getArticleById(id: string): Promise<Article | null> {
		const cacheKey = `articles:by-id:${id}`;

		const cached = await redis.get(cacheKey);
		if (cached) {
			return JSON.parse(cached) as Article;
		}
		const row = await this.repo.getById(id);
		if (!row) return null;
		const result = mapArticleRowToEntity(row);
		await redis.set(cacheKey, JSON.stringify(result), "EX", 60 * 5);
		return result;
	}
	async searchArticles(
		query: string,
		limit = 10,
		offset = 0,
	): Promise<Article[]> {
		const cacheKey = `articles:search:${query}:${limit}:${offset}`;

		const cached = await redis.get(cacheKey);
		if (cached) {
			return JSON.parse(cached) as Article[];
		}
		const rows = await this.repo.findSearchResults(query, limit, offset);

		const result = rows.map(mapArticleRowToEntity);
		await redis.set(cacheKey, JSON.stringify(result), "EX", 60);
		return result;
	}

	async countSearchResults(query: string): Promise<number> {
		const cacheKey = `articles:search:count:${query}`;
		const cached = await redis.get(cacheKey);
		if (cached) {
			return Number(cached);
		}
		const count = await this.repo.countSearchResults(query);
		await redis.set(cacheKey, String(count), "EX", 60);
		return count;
	}

	async getNewArticle(limit = 5): Promise<Article[]> {
		const row = await this.repo.getNewArticles(limit);
		return row.map(mapArticleRowToEntity);
	}
}
