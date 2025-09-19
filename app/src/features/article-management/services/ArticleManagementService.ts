import { mapArticleRowToEntity, type ArticleRow} from "../mapper";
import type { Article } from "../domain/Article";
import { ArticleManagementRepository } from "../repository/ArticleManagementRepository";
import { nanoid } from "@/lib/nanoid";

export class ArticleManagementService {
  private repo = new ArticleManagementRepository();
  async getManagementArticle(
    userId: string,
    limit = 10,
    offset = 0,
    query?: string,
    category?: string,

  ): Promise<ArticleRow[]> {
    const rows = await this.repo.findAllByUser(userId, limit, offset, query, category);
    return rows
  }

  async getArticleByUserId(
    id: string,
    userId: string,
  ): Promise<Article | null> {
    const row = await this.repo.getById(id, userId);
    if (!row) return null;
    return mapArticleRowToEntity(row);
  }
  async createDraft(userId:string, title: string): Promise<string> {  
    const id = nanoid();
    const articleId = await this.repo.createArticle(id, userId);
    return articleId;
  }

  async updateArticle(
    id: string,
    data: ArticleRow,
  ): Promise<boolean> { 

    try {
    const { tags, ...articleData } = data;
    const updated = await this.repo.updateArticle(id, articleData);
    if (data.tags) {
      await this.repo.updateArticleTags(id, data.tags);
    }
    return true
    } catch (error) {
      console.error("Error updating article:", error);
      return false;
    }
  }

  async deleteArticle(id: string, userId: string): Promise<boolean> { 
    try {
      const deleted = await this.repo.deleteArticle(id, userId);
      return deleted;
    } catch (error) {
      console.error("Error deleting article:", error);
      return false;
    }
  }
}
