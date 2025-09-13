import type { JSONContent } from "@tiptap/core";

export interface ArticleContent {
  type: "text" | "image" | "video";
  content: string | null;
  mediaUrl: string | null;
  sortOrder: number;
  attributes?: Record<string, any> | null;
  createdAt: Date;
}

export interface Article {
  id: number;
  title: string;
  shortDescription: string;
  thumbnailUrl: string;
  categories: string[];
  author: string;
  publishedAt?: string;
  updatedAt?: string| null;
  contents?: ArticleContent[];
  createdAt: string;
  content?: JSONContent;
  sortOrder?: number;
}
