import type { Article } from "./domain/Article";

export interface ArticleRow {
  id: number;
  title: string;
  short_description: string;
  author_name: string;
  author_id: string;
  category_id: number | null;
  thumbnail_url: string;
  status: "draft" | "published" | "archived";
  published_at: Date;
  updated_at: Date | null;
  tags?: { id: number; name: string }[];
  created_at: Date;
  content: JSON | null;
  sort_order?: number;
}

export function mapArticleRowToEntity(
  row: ArticleRow 
): Article {
  const article: any = {
    id: row.id,
    title: row.title,
    shortDescription: row.short_description,
    authorId: row.author_id,
    categoryId: row.category_id,
    authorName: row.author_name,
    thumbnailUrl: row.thumbnail_url,
    publishedAt: row.published_at,
    updatedAt: row.updated_at || null,
    content: row.content || null,
    status: row.status,
    createdAt: row.created_at,
    tags: row.tags || [],
    sortOrder: row.sort_order || null,
  };
  return article;
}
