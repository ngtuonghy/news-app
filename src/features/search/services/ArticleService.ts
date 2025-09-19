import { ArticleRepository } from "../repository/ArticleRepository";
import { mapArticleRowToEntity } from "../mapper";
import type { Article } from "../domain/Article";

export class ArticleService {
  private repo = new ArticleRepository();
  async getLatestArticles(
    limit = 10,
    offset = 0,
    category?: string,
  ): Promise<Article[]> {
    const rows = await this.repo.findBySection(limit,offset,category);
    return rows.map(mapArticleRowToEntity);
  }
  async getArticlesByCategorySlug(
    slug: string,
    limit = 10,
  ): Promise<Article[]> {
    const rows = await this.repo.findByCategorySlug(slug, limit);
    return rows.map(mapArticleRowToEntity);
  }

  async getArticlesTopCategoriesWithArticles(
    limitCategory = 5,
    limitArticles = 5,
  ) {
    const rows = await this.repo.findTopCategoriesWithArticles(limitCategory);

    const result: { slug: string; name: string; articles: Article[] }[] = [];

    for (const row of rows) {
      let category = result.find((c) => c.slug === row.category_slug);
      if (!category) {
        category = {
          slug: row.category_slug,
          name: row.category_name,
          articles: [],
        };
        result.push(category);
      }

      if (category.articles.length < limitArticles) {
        category.articles.push({
          id: row.article_id,
          title: row.title,
          shortDescription: row.short_description,
          thumbnailUrl: row.thumbnail_url,
          publishedAt: row.published_at,
          author: row.author_name,
          categories: row.article_categories,
        });
      }
    }
    return result;
  }
  async getArticleById(id: string): Promise<Article | null> {
    const row = await this.repo.getById(id);
    if (!row) return null;
    return mapArticleRowToEntity(row);
  }

  async searchArticles(
    query: string,
    limit = 10,
    offset = 0,
  ): Promise<Article[]> {
    const rows = await this.repo.findSearchResults(query, limit, offset);
    return rows.map(mapArticleRowToEntity);
  }
  async countSearchResults(query: string): Promise<number> {
    return this.repo.countSearchResults(query);
  }
  async getNewArticle(limit = 5): Promise<Article[]> {
    const row = await this.repo.getNewArticles(limit);
    return row.map(mapArticleRowToEntity);
  }
}
