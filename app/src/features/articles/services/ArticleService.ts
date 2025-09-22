import { ArticleRepository } from "../repository/ArticleRepository";
import { mapArticleRowToEntity } from "../mapper";
import type { Article } from "../domain/Article";
import { redis } from "@/lib/redis";

export class ArticleService {
	private repo = new ArticleRepository();

	// private async acquireLock(lockKey: string, ttl = 30): Promise<boolean> {
	// 	const lock = await redis.set(lockKey, "1", "EX", ttl, "NX");
	// 	return lock === "OK";
	// }
	//
	private async acquireLockWithRetry(
		lockKey: string,
		ttl = 30,
		maxRetries = 5,
	): Promise<boolean> {
		let attempt = 0;
		let delay = 50;
		while (attempt < maxRetries) {
			const lock = await redis.set(lockKey, "1", "EX", ttl, "NX");
			if (lock === "OK") return true;

			await new Promise((r) => setTimeout(r, delay));

			attempt++;
			delay *= 2;
		}
		return false;
	}

	private async waitForCache<T>(
		cacheKey: string,
		retryInterval = 100,
		timeout = 5000,
	): Promise<T | null> {
		const start = Date.now();
		while (Date.now() - start < timeout) {
			const cached = await redis.get(cacheKey);
			if (cached) return JSON.parse(cached) as T;
			await new Promise((r) => setTimeout(r, retryInterval));
		}
		return null;
	}

	private async fetchAndCache<T>(
		cacheKey: string,
		lockKey: string,
		fetchFn: () => Promise<T>,
		cacheTTL = 300,
	): Promise<T> {
		const data = await fetchFn();
		await redis.set(cacheKey, JSON.stringify(data), "EX", cacheTTL);
		await redis.del(lockKey);
		return data;
	}

	async getLatestArticles(
		limit = 10,
		offset = 0,
		category?: string,
	): Promise<Article[]> {
		const cacheKey = `articles:latest:${category || "all"}:${limit}:${offset}`;
		const lockKey = cacheKey + ":lock";

		const cached = await redis.get(cacheKey);
		if (cached) return JSON.parse(cached);

		const gotLock = await this.acquireLockWithRetry(lockKey, 30, 5);
		if (gotLock) {
			return this.fetchAndCache(
				cacheKey,
				lockKey,
				async () => {
					const rows = await this.repo.findBySection(limit, offset, category);
					return rows.map(mapArticleRowToEntity);
				},
				120,
			);
		}

		const data = await this.waitForCache<Article[]>(cacheKey);
		if (data) return data;

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
		if (cached) return JSON.parse(cached);

		const rows = await this.repo.findByCategorySlug(slug, limit);
		const result = rows.map(mapArticleRowToEntity);
		await redis.set(cacheKey, JSON.stringify(result), "EX", 120);
		return result;
	}

	async getArticlesTopCategoriesWithArticles(
		limitCategory = 5,
		limitArticles = 5,
	): Promise<{ slug: string; name: string; articles: Article[] }[]> {
		const cacheKey = `articles:top-categories:${limitCategory}:${limitArticles}`;
		const lockKey = cacheKey + ":lock";

		const cached = await redis.get(cacheKey);
		if (cached) return JSON.parse(cached);

		const gotLock = await this.acquireLockWithRetry(lockKey, 30, 5);

		const fetchFn = async () => {
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
				map.get(row.category_slug)!.articles.push({
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

			return Array.from(map.values());
		};

		if (gotLock) return this.fetchAndCache(cacheKey, lockKey, fetchFn, 120);

		const data =
			await this.waitForCache<
				{ slug: string; name: string; articles: Article[] }[]
			>(cacheKey);
		if (data) return data;

		const result = await fetchFn();
		await redis.set(cacheKey, JSON.stringify(result), "EX", 120);
		return result;
	}

	async getArticleById(id: string): Promise<Article | null> {
		const cacheKey = `articles:by-id:${id}`;
		const cached = await redis.get(cacheKey);
		if (cached) return JSON.parse(cached);

		const row = await this.repo.getById(id);
		if (!row) return null;
		const result = mapArticleRowToEntity(row);
		await redis.set(cacheKey, JSON.stringify(result), "EX", 300);
		return result;
	}

	async searchArticles(
		query: string,
		limit = 10,
		offset = 0,
	): Promise<Article[]> {
		const cacheKey = `articles:search:${query}:${limit}:${offset}`;
		const cached = await redis.get(cacheKey);
		if (cached) return JSON.parse(cached);

		const rows = await this.repo.findSearchResults(query, limit, offset);
		const result = rows.map(mapArticleRowToEntity);
		await redis.set(cacheKey, JSON.stringify(result), "EX", 60);
		return result;
	}

	async countSearchResults(query: string): Promise<number> {
		const cacheKey = `articles:search:count:${query}`;
		const cached = await redis.get(cacheKey);
		if (cached) return Number(cached);

		const count = await this.repo.countSearchResults(query);
		await redis.set(cacheKey, String(count), "EX", 60);
		return count;
	}

	async getNewArticle(limit = 5): Promise<Article[]> {
		const cacheKey = `articles:new:${limit}`;
		const lockKey = cacheKey + ":lock";

		const gotLock = await this.acquireLockWithRetry(lockKey, 30, 5);
		if (gotLock) {
			return this.fetchAndCache(
				cacheKey,
				lockKey,
				async () => {
					const rows = await this.repo.getNewArticles(limit);
					return rows.map(mapArticleRowToEntity);
				},
				300,
			);
		}
		const data = await this.waitForCache<Article[]>(cacheKey);
		if (data) return data;
		const rows = await this.repo.getNewArticles(limit);
		const result = rows.map(mapArticleRowToEntity);
		await redis.set(cacheKey, JSON.stringify(result), "EX", 300);
		return result;
	}
}


