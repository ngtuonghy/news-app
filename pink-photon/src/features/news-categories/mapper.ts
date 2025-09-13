import type { Category } from "./domain/Category";

export interface CategoryRow {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number | null;
  is_active?: boolean;
  position?: number;
  meta_title?: string;
  meta_description?: string;
  children?: CategoryRow[];
}

export function mapCategoryRowToEntityRecursive(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    parentId: row.parentId,
    position: row.position,
    isActive: row.isActive,
    children: row.children?.map(mapCategoryRowToEntityRecursive) || [],
  };
}

export function mapCategoryRowToEntity(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    slug: row.slug,
    parentId: row.parent_id || null,
    isActive: row.is_active || false,
    position: row.position || 0,
    metaTitle: row.meta_title || "",
    metaDescription: row.meta_description || "",
  };
}
