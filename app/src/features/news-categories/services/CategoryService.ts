import { redis } from "@/lib/redis";
import type { Category } from "../domain/Category";
import {
  mapCategoryRowToEntityRecursive,
} from "../mapper";
import { CategoryRepository } from "../repository/CategoryRepository";

export class CategoryService {
  private repo = new CategoryRepository();
  async getCategories(): Promise<Category[]> {
    const redis_key = `categories:all`;
    const cached = await redis.get(redis_key);
    if (cached) {
      return JSON.parse(cached) as Category[];
    }
    const rows = await this.repo.findTree();
    const result = rows.map(mapCategoryRowToEntityRecursive);
    await redis.set(redis_key, JSON.stringify(result), "EX", 60 * 60 * 24); // 24 hours
    return result;

  }
 
}
