import pool from "../../../lib/db";
import type { ArticleRow } from "../mapper";

export class ArticleManagementRepository {
	async findAllByUser(
		userId: string,
		limit = 10,
		offset = 0,
		category?: string,
	): Promise<ArticleRow[]> { 
		const { rows } = await pool.query(
			`SELECT 
        a.id,
        a.title,
        a.short_description,
        u.username AS author_name,
        a.published_at,
        a.updated_at,
        a.created_at,
        a.thumbnail_url,
        c.name AS category_name,
        COALESCE(JSON_AGG(JSON_BUILD_OBJECT('id', t.id, 'name', t.name)) FILTER (WHERE t.id IS NOT NULL), '[]') AS tags,
      JSON_BUILD_OBJECT ('id', c.id,'name', c.name) AS category
      FROM articles a
      JOIN users u ON a.author_id = u.id
      LEFT JOIN article_tags at ON a.id = at.article_id
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN tags t ON at.tag_id = t.id
      WHERE ($2::text IS NULL OR c.slug = $2) AND  a.author_id = $1
      GROUP BY u.username, c.id, a.id
      ORDER BY a.created_at DESC NULLS LAST, a.id DESC
      LIMIT $3 OFFSET $4`,
			[userId, category ?? null, limit, offset],
		);

		return rows.map((row) => ({
			...row,
			categories: row.categories || [],
		}));
	}

	// =================== GET BY ID ===================
	async getById(id: string, userId: string): Promise<ArticleRow | null> {
		const { rows } = await pool.query<ArticleRow>(
			`
SELECT 
  a.id,
  a.title,
  a.short_description,
  u.username AS author_name,
  a.published_at,
  a.updated_at,
  a.thumbnail_url,
  a.content,
  a.author_id,
  a.status,
  a.category_id,
  a.created_at,
  COALESCE(JSON_AGG(JSON_BUILD_OBJECT('id', t.id, 'name', t.name)) FILTER (WHERE t.id IS NOT NULL), '[]') AS tags
FROM articles a
JOIN users u ON a.author_id = u.id
LEFT JOIN article_tags at ON a.id = at.article_id
LEFT JOIN tags t ON at.tag_id = t.id
WHERE a.id = $1 AND a.author_id = $2
GROUP BY u.username, a.id
LIMIT 1

      `,
			[id, userId],
		);
		console.log(rows);

		return rows[0] ?? null;
	}
	// =================== CREATE ===================
	async createArticle(id: string, userId: string): Promise<string> {
		const { rows } = await pool.query<{ id: string }>(
			`
      INSERT INTO articles (id, author_id)
      VALUES ($1, $2)
      RETURNING id
      `,
			[id, userId],
		);

		return rows[0].id;
	}

	async updateArticle(id: string, data: {}): Promise<boolean> {
		const fields = Object.keys(data);
		if (fields.length === 0) return false;

		const setClause = fields
			.map((field, index) => `${field} = $${index + 2}`)
			.join(", ");

		const values = Object.values(data);

		const result = await pool.query(
			`
    UPDATE articles
    SET ${setClause}, updated_at = NOW()
    WHERE id = $1
    `,
			[id, ...values],
		);

		return (result.rowCount ?? 0) > 0;
	}

  async updateArticleTags(articleId: string, tags: { id?: number | null; name: string }[]): Promise<void> {

  await pool.query(`DELETE FROM article_tags WHERE article_id = $1`, [articleId]);

  if (tags.length === 0) return;

  const existingTags = tags.filter(t => t.id != null);
  const newTags = tags.filter(t => t.id == null);

  if (newTags.length > 0) {
    const values = newTags.map((_, i) => `($${i + 1})`).join(", ");
    const insertQuery = `
      INSERT INTO tags (name)
      VALUES ${values}
      ON CONFLICT (name) DO NOTHING
      RETURNING id, name
    `;
    const res = await pool.query<{ id: number; name: string }>(insertQuery, newTags.map(t => t.name));

    newTags.forEach(t => {
      const found = res.rows.find(r => r.name === t.name);
      if (found) t.id = found.id;
    });

    const conflictNames = newTags.filter(t => t.id == null).map(t => t.name);
    if (conflictNames.length > 0) {
      const res2 = await pool.query<{ id: number; name: string }>(
        `SELECT id, name FROM tags WHERE name = ANY($1)`,
        [conflictNames]
      );
      res2.rows.forEach(r => {
        const t = newTags.find(t => t.name === r.name);
        if (t) t.id = r.id;
      });
    }
  }

  const allTags = [...existingTags, ...newTags].filter(t => t.id != null);

  if (allTags.length === 0) return;

  const linkValues = allTags.map((_, i) => `($1, $${i + 2})`).join(", ");
  const linkQuery = `INSERT INTO article_tags (article_id, tag_id) VALUES ${linkValues}`;
  await pool.query(linkQuery, [articleId, ...allTags.map(t => t.id!)]);
}


}
