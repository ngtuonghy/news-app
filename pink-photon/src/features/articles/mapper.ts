import type { Article } from "./domain/Article";

export interface ArticleRow {
  id: string;
  title: string;
  short_description: string;
  author_name: string;
  thumbnail_url: string;
  categories: string[];
  published_at?: string | null;
  created_at: string;
  content:JSON;
  updated_at?: string | null;
  sort_order?: number;
}



export function mapArticleRowToEntity(
  row: ArticleRow ,
): Article  {
  const article: any = {
    id: row.id,
    title: row.title,
    shortDescription: row.short_description,
    author: row.author_name,
    categories: row.categories || [],
    thumbnailUrl: row.thumbnail_url,
    publishedAt: row.published_at,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at || null,
    sortOrder: row.sort_order || null,
  };

 
  return article;
}
