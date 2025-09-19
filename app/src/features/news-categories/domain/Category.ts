export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parentId?: number | null;
  isActive?: boolean;
  position?: number;
  metaTitle?: string;
  metaDescription?: string;
  children?: Category[] | null;
}
