import pool from "../../../lib/db";
import type { CategoryRow } from "../mapper";

export class CategoryRepository {
  async findAll(limit = 10): Promise<CategoryRow[]> {
    console.log("Fetching categories with limit:", limit);
    const { rows } = await pool.query(
      `
      SELECT id, name, description, slug, meta_title, meta_description, parent_id, is_active, position
      FROM categories
      ORDER BY id ASC limit $1
    `,
      [limit],
    );
    return rows;
  }
  async findBySlug(slug: string): Promise<CategoryRow | null> {
    console.log("Fetching category with slug:", slug);
    const { rows } = await pool.query(
      `
      SELECT id, name, description, slug
      FROM categories
      WHERE slug = $1
      LIMIT 1
    `,
      [slug],
    );
    return rows[0] || null;
  }
  async getCategoryIdBySlug(slug: string): Promise<number | null> {
    const { rows } = await pool.query(
      `SELECT id FROM categories WHERE slug = $1 LIMIT 1`,
      [slug],
    );
    return rows[0]?.id ?? null;
  }

  async findTree(): Promise<CategoryRow[]> {
    const { rows } = await pool.query(
      `
    SELECT id, name, description, slug, meta_title, meta_description,
           parent_id, is_active, position
    FROM categories
    ORDER BY parent_id NULLS FIRST, position ASC, id ASC
    `,
    );

    const map = new Map<number, any>();
    const roots: any[] = [];

    rows.forEach((row) => {
      map.set(row.id, { ...row, children: [] });
    });

    map.forEach((cat) => {
      if (cat.parent_id) {
        const parent = map.get(cat.parent_id);
        if (parent) parent.children.push(cat);
      } else {
        roots.push(cat);
      }
    });

    return roots;
  }
}
