import type { Category } from "../domain/Category";
import {
  mapCategoryRowToEntity,
  mapCategoryRowToEntityRecursive,
} from "../mapper";
import { CategoryRepository } from "../repository/CategoryRepository";

export class CategoryService {
  private repo = new CategoryRepository();
  async getCategories(): Promise<Category[]> {
    const rows = await this.repo.findTree();
    // console.log(rows);
    return rows.map(mapCategoryRowToEntityRecursive);
  }
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const row = await this.repo.findBySlug(slug);

    if (!row) return null;
    return mapCategoryRowToEntity(row);
  }
}
