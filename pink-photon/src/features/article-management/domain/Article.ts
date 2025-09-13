import type { JSONContent } from "@tiptap/core";

export interface Article {
  id: number;
  title: string;
  shortDescription: string;
  thumbnailUrl: string;
  categories: string[];
  authorName: string;
  authorId: string;
  categoryId?: number | null;
  publishedAt: Date;
  status: "draft" | "published" | "archived";
  updatedAt?: Date | null;
  tags?: { id: number; name: string }[];
  createdAt: Date;
  content?: JSONContent | null;
  sortOrder?: number;
}
