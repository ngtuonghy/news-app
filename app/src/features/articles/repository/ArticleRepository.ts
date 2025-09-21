import pool from "../../../lib/db";
import { CategoryRepository } from "../../news-categories/repository/CategoryRepository";
import type { ArticleRow } from "../mapper";

export class ArticleRepository {
  // =================== HOME / SECTION ===================
  async findBySection(limit = 10, offset = 0, category?: string): Promise<ArticleRow[]> {
    // console.log("Category filter:", category, "Limit:", limit, "Offset:", offset);
    const { rows } = await pool.query(
      `SELECT 
        a.id,
        a.title,
        a.short_description,
        u.username AS author_name,
        a.published_at,
        a.updated_at,
        a.thumbnail_url,
        ARRAY_REMOVE(ARRAY[p.name, c.name], NULL) AS categories,
        ap.sort_order
      FROM articles a
      JOIN users u ON a.author_id = u.id
      LEFT JOIN article_positions ap ON a.id = ap.article_id
      JOIN categories c ON a.category_id = c.id
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE a.is_deleted = false AND ($1::text IS NULL OR c.slug = $1) AND a.status = 'published'
      GROUP BY a.id, u.username, ap.sort_order, c.id, p.id
      ORDER BY ap.sort_order ASC, a.published_at DESC
      LIMIT $2 OFFSET $3
      `,
      [category ?? null, limit, offset],
    );

    return rows.map((row) => ({
      ...row,
      categories: row.categories || [],
    }));
  }

  // =================== GET BY ID ===================
  async getById(id: string): Promise<ArticleRow | null> {
    const { rows } = await pool.query(
      `
      SELECT 
        a.id,
        a.title,
        a.short_description,
        u.username AS author_name,
        a.published_at,
        a.updated_at,
        a.content,
        a.thumbnail_url
      FROM articles a
      JOIN users u ON a.author_id = u.id
      JOIN categories c ON a.category_id = c.id
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE a.is_deleted = false AND a.id = $1 AND a.status = 'published'
      LIMIT 1
      `,
      [id],
    );

    return rows[0] || null;
  }

  // =================== FIND BY CATEGORY (FULL) ===================
async findByCategorySlug(slug: string, limit = 10): Promise<ArticleRow[]> {
  const repo = new CategoryRepository();
  const categoryId = await repo.getCategoryIdBySlug(slug);
  if (!categoryId) return [];

  const { rows } = await pool.query(
    `
    WITH RECURSIVE category_tree AS (
      SELECT id FROM categories WHERE id = $1
      UNION ALL
      SELECT c.id
      FROM categories c
      JOIN category_tree ct ON c.parent_id = ct.id
    )
    SELECT 
      a.id,
      a.title,
      a.short_description,
      u.username AS author_name,
      a.published_at,
      a.updated_at,
      a.thumbnail_url,
      ARRAY_REMOVE(ARRAY[p.name, c.name], NULL) AS categories,
      COALESCE(ap.sort_order, 9999) AS sort_order,
      COALESCE(tags.tags, '{}') AS tags
    FROM articles a
    JOIN users u ON a.author_id = u.id
    JOIN categories c ON a.category_id = c.id
    LEFT JOIN categories p ON c.parent_id = p.id
    LEFT JOIN article_positions ap ON a.id = ap.article_id
    LEFT JOIN (
      SELECT at.article_id, ARRAY_AGG(t.name) AS tags
      FROM article_tags at
      JOIN tags t ON at.tag_id = t.id
      GROUP BY at.article_id
    ) tags ON a.id = tags.article_id
    WHERE a.is_deleted = false
      AND a.status = 'published'
      AND a.category_id IN (SELECT id FROM category_tree)
    GROUP BY a.id, u.username, ap.sort_order, c.id, p.id, tags.tags
    ORDER BY sort_order ASC, a.published_at DESC
    LIMIT $2
    `,
    [categoryId, limit]
  );

  return rows.map(row => ({
    ...row,
    categories: row.categories || [],
    tags: row.tags || [],
  }));
}

  // =================== SEARCH ===================
  async findSearchResults(
    query: string,
    limit: number,
    offset: number,
  ): Promise<ArticleRow[]> {
    const { rows } = await pool.query(
      `
      SELECT 
        a.id,
        a.title,
        a.short_description,
        u.username AS author_name,
        a.published_at,
        a.updated_at,
        a.thumbnail_url,
        ARRAY_REMOVE(ARRAY[p.name, c.name], NULL) AS categories,
        MAX(ap.sort_order) AS sort_order,
        ts_rank(a.tsv, plainto_tsquery('simple', unaccent($1))) AS rank
      FROM articles a
      JOIN users u ON a.author_id = u.id
      JOIN categories c ON a.category_id = c.id
      LEFT JOIN categories p ON c.parent_id = p.id
      LEFT JOIN article_positions ap ON a.id = ap.article_id
      WHERE a.is_deleted = false
        AND a.tsv @@ plainto_tsquery('simple', unaccent($1))
        AND a.status = 'published'
      GROUP BY a.id, u.username, a.tsv, c.id, p.id
      ORDER BY rank DESC, COALESCE(MAX(ap.sort_order), 999) ASC, a.published_at DESC
      LIMIT $2 OFFSET $3
      `,
      [query, limit, offset],
    );

    return rows.map((row) => ({
      ...row,
      categories: row.categories || [],
    }));
  }

  async countSearchResults(query: string): Promise<number> {
    const { rows } = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM articles a
      WHERE a.is_deleted = false
        AND a.tsv @@ plainto_tsquery('simple', unaccent($1))
      `,
      [query],
    );

    return Number(rows[0].total);
  }

  async findTopCategoriesWithArticles(limitCategory = 5, limitArticles = 5) {
  const { rows } = await pool.query(
    `
    WITH RECURSIVE category_tree AS (
      SELECT id, name, slug, parent_id
      FROM categories
      WHERE parent_id IS NULL
      UNION ALL
      SELECT c.id, c.name, c.slug, c.parent_id
      FROM categories c
      JOIN category_tree ct ON c.parent_id = ct.id
    ),
    category_counts AS (
      SELECT ct.id AS root_id, COUNT(a.id) AS article_count
      FROM category_tree ct
      LEFT JOIN categories c ON c.id = ct.id OR c.parent_id = ct.id
      LEFT JOIN articles a ON a.category_id = c.id AND a.is_deleted = false AND a.status = 'published'
      GROUP BY ct.id
    ),
    top_categories AS (
      SELECT c.id, c.name, c.slug
      FROM categories c
      JOIN category_counts cc ON cc.root_id = c.id
      ORDER BY cc.article_count DESC
      LIMIT $1
    ),
    ranked_articles AS (
      SELECT 
        a.*,
        ROW_NUMBER() OVER (
          PARTITION BY 
            CASE WHEN c.parent_id IS NULL THEN c.id ELSE c.parent_id END
          ORDER BY a.published_at DESC
        ) AS rn
      FROM articles a
      JOIN categories c ON a.category_id = c.id
      WHERE a.is_deleted = false AND a.status = 'published'
    )
    SELECT 
      c.slug AS category_slug,
      c.name AS category_name,
      a.id AS article_id,
      a.title,
      a.short_description,
      a.thumbnail_url,
      a.published_at,
      u.username AS author_name,
      ARRAY_REMOVE(ARRAY[parent.name, cat.name], NULL) AS article_categories
    FROM top_categories c
    JOIN ranked_articles a 
      ON a.rn <= $2
      AND (a.category_id = c.id OR a.category_id IN (SELECT id FROM categories WHERE parent_id = c.id))
    JOIN users u ON u.id = a.author_id
    LEFT JOIN categories cat ON cat.id = a.category_id
    LEFT JOIN categories parent ON parent.id = cat.parent_id
    ORDER BY c.id, a.published_at DESC
    `,
    [limitCategory, limitArticles]
  );

  return rows;
}


   async getNewArticles(limit = 5): Promise<ArticleRow[]> {
    const { rows } = await pool.query(
      `
      SELECT 
        a.id,
        a.title,
        a.short_description,
        u.username AS author_name,
        a.published_at,
        a.updated_at,
        a.created_at,
        a.thumbnail_url,
        ARRAY_REMOVE(ARRAY[p.name, c.name], NULL) AS categories
      FROM articles a
      JOIN users u ON a.author_id = u.id
      JOIN categories c ON a.category_id = c.id
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE a.is_deleted = false AND a.status = 'published'
      ORDER BY a.published_at DESC
      LIMIT $1
      `,
      [limit],
    );

    return rows.map((row) => ({
      ...row,
      categories: row.categories || [],
    }));
  }
}
