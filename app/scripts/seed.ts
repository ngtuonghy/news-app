import "dotenv/config";
import { Faker, vi, en } from "@faker-js/faker";
import pkg from "pg";
import bcrypt from "bcrypt";
import { nanoid } from "../src/lib/nanoid.ts";
import { fakeTiptapDoc } from "./fakeTiptapDoc.ts";

const { Pool } = pkg;
const faker = new Faker({ locale: [vi, en] });

const pool = new Pool({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: Number(process.env.DB_PORT),
});

const config = {
	users: 10,
	maxChildren: 7, // số con mỗi root
	tags: 10,
	articles: 10000,
	minBlocks: 2,
	maxBlocks: 8,
	maxTagsPerArticle: 5,
};

function slugify(text: string): string {
	return text
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/đ/g, "d")
		.replace(/[^a-z0-9\s-]/g, "")
		.trim()
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-");
}

// ==================== Seed Users ====================
async function seedUsers(): Promise<string[]> {
	const passwordHash = await bcrypt.hash("1234", 12);
	const reporterIds: string[] = [];
	for (let i = 0; i < config.users; i++) {
		const username = faker.internet.username().toLowerCase();
		const password_hash = passwordHash;
		const full_name = faker.person.fullName();
		const email = faker.internet.email();
		const role = faker.helpers.arrayElement(["reporter", "reader", "admin"]);
		const avatar_url = faker.image.avatar();

		const { rows } = await pool.query(
			`INSERT INTO users (username, password_hash, full_name, email, role, avatar_url)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT DO NOTHING RETURNING id, role`,
			[username, password_hash, full_name, email, role, avatar_url],
		);

		if (rows[0] && rows[0].role === "reporter") reporterIds.push(rows[0].id);
	}
	return reporterIds;
}

// ==================== Seed Categories ====================
const ROOT_CATEGORIES = [
	"Thế giới",
	"Kinh tế",
	"Giải trí",
	"Thể thao",
	"Công nghệ",
	"Sức khỏe",
	"Văn hóa",
	"Giáo dục",
	"Du lịch",
	"Pháp luật",
	"Môi trường",
	"Xe cộ",
	"Đời sống",
	"Ý kiến",
	"Thời trang",
	"Ẩm thực",
	"Nhân vật",
	"Sự kiện",
	"Tâm linh",
	"Quân sự",
	"Chính trị",
	"Thời sự",
];

async function seedNewsCategories(): Promise<{
	root: number[];
	children: number[];
}> {
	const rootIds: number[] = [];
	const childIds: number[] = [];

	for (let i = 0; i < ROOT_CATEGORIES.length; i++) {
		const name = ROOT_CATEGORIES[i];
		const slug = slugify(name);

		const { rows: existingRoot } = await pool.query(
			`SELECT id FROM categories WHERE slug = $1`,
			[slug],
		);
		if (existingRoot[0]) {
			rootIds.push(existingRoot[0].id);
			continue;
		}

		const description = faker.lorem.sentence();

		const { rows } = await pool.query(
			`INSERT INTO categories (name, slug, description, position, is_active, meta_title, meta_description, parent_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id`,
			[name, slug, description, i, true, name, description.slice(0, 160), null],
		);

		const rootId = rows[0].id;
		rootIds.push(rootId);

		const childCount = faker.number.int({ min: 4, max: 7 });
		for (let j = 0; j < childCount; j++) {
			const childName = faker.lorem.words(2); // tên con ngắn hơn
			const childSlug = slugify(childName);

			const { rows: existingChild } = await pool.query(
				`SELECT id FROM categories WHERE slug = $1 AND parent_id = $2`,
				[childSlug, rootId],
			);
			if (existingChild[0]) continue;

			const childDesc = faker.lorem.sentence();
			const { rows: childRows } = await pool.query(
				`INSERT INTO categories (name, slug, description, position, is_active, meta_title, meta_description, parent_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING
         RETURNING id`,
				[
					childName,
					childSlug,
					childDesc,
					j,
					true,
					childName,
					childDesc.slice(0, 160),
					rootId,
				],
			);

			if (childRows[0]) childIds.push(childRows[0].id);
		}
	}

	return { root: rootIds, children: childIds };
}
// ==================== Seed Tags ====================
async function seedTags(): Promise<number[]> {
	const tagIds: number[] = [];
	for (let i = 0; i < config.tags; i++) {
		const name = faker.lorem.word();
		const { rows } = await pool.query(
			`INSERT INTO tags (name) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id`,
			[name],
		);
		if (rows[0]) tagIds.push(rows[0].id);
	}
	return tagIds;
}

// ==================== Seed Articles ====================
async function seedArticles(
  reporterIds: string[],
  rootIds: number[],
  childIds: number[],
  tagIds: number[],
): Promise<string[]> {
  const articleIds: string[] = [];
  const articleValues: any[] = [];
  const articleTagValues: any[] = [];
  const now = new Date();
  const yesterday = new Date(now.getTime() - 2 * 24*60*60*1000);

  for (let i = 0; i < config.articles; i++) {
    if (reporterIds.length === 0) break;
    const id = nanoid();
    const author_id = faker.helpers.arrayElement(reporterIds);
    const created_at = faker.date.between({ from: new Date(now.getTime() - 14*24*60*60*1000), to:new Date(now.getTime() - 24*60*60*1000)  });
    const title = faker.lorem.sentence();
    const short_description = faker.lorem.paragraph();
    const thumbnail_url = faker.image.url();
    const status = faker.helpers.arrayElement(["draft","published"]);
    const content = fakeTiptapDoc();
    let published_at: Date | null = null;
    if (status === "published") {
  if (created_at < yesterday) {
    published_at = faker.date.between({ from: created_at, to:yesterday  });
  } else {
    published_at = created_at;
  }
}



    const category_id = (faker.datatype.boolean() && childIds.length > 0)
      ? faker.helpers.arrayElement(childIds)
      : faker.helpers.arrayElement(rootIds);

    articleValues.push([
      id, author_id, category_id, title, short_description,
      created_at.toISOString(), thumbnail_url, status, content,
      published_at ? published_at.toISOString() : null
    ]);

    articleIds.push(id);

    // Random tags
    if (tagIds.length > 0) {
      const tags = faker.helpers.arrayElements(tagIds, faker.number.int({ min:1, max: config.maxTagsPerArticle }));
      for (const tagId of tags) {
        articleTagValues.push([id, tagId]);
      }
    }
  }

  const ARTICLE_BATCH = 5000;
  for (let i = 0; i < articleValues.length; i += ARTICLE_BATCH) {
    const chunk = articleValues.slice(i, i + ARTICLE_BATCH);
    const placeholders = chunk.map((_, j) => 
      `($${j*10+1},$${j*10+2},$${j*10+3},$${j*10+4},$${j*10+5},$${j*10+6},$${j*10+7},$${j*10+8},$${j*10+9},$${j*10+10})`
    ).join(",");
    await pool.query(
      `INSERT INTO articles (id, author_id, category_id, title, short_description, created_at, thumbnail_url, status, content, published_at)
       VALUES ${placeholders}`,
      chunk.flat()
    );
  }

  const TAG_BATCH = 2000;
  for (let i = 0; i < articleTagValues.length; i += TAG_BATCH) {
    const chunk = articleTagValues.slice(i, i + TAG_BATCH);
    const placeholders = chunk.map((_, j) => `($${j*2+1},$${j*2+2})`).join(",");
    await pool.query(
      `INSERT INTO article_tags (article_id, tag_id) VALUES ${placeholders} ON CONFLICT DO NOTHING`,
      chunk.flat()
    );
  }

  return articleIds;
}

// ==================== Seed Article Positions ====================
async function seedArticlePositions(articleIds: string[]) {
	const homepageArticles = faker.helpers.arrayElements(articleIds, 7);
	for (let i = 0; i < homepageArticles.length; i++) {
		await pool.query(
			`INSERT INTO article_positions (article_id, section, category_id, sort_order)
       VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
			[homepageArticles[i], "home_page", null, i + 1],
		);
	}

	const categoryPageArticles = faker.helpers.arrayElements(articleIds, 20);
	let sort = 1;
	for (const articleId of categoryPageArticles) {
		const { rows } = await pool.query(
			`SELECT category_id FROM articles WHERE id=$1`,
			[articleId],
		);
		const category_id = rows[0]?.category_id;
		if (!category_id) continue;

		await pool.query(
			`INSERT INTO article_positions (article_id, section, category_id, sort_order)
       VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
			[articleId, "category_page", category_id, sort++],
		);
	}
}

// ==================== Reset Database ====================
async function resetDb() {
	console.log("♻  Reset database...");
	await pool.query(`
		TRUNCATE TABLE
			article_tags,
			article_positions,
			articles,
			tags,
			categories,
			users
		RESTART IDENTITY CASCADE;
	`);
	console.log("✅ Database reset completed!");
}

// ==================== Main Seed ====================

async function seed() {
	const reset = process.argv.includes("--reset"); // chạy: ts-node seed.ts --reset
	if (reset) {
		await resetDb();
	}
	console.log("🌱 Seeding database...");
	const reporterIds = await seedUsers();
	const { root: rootIds, children: childIds } = await seedNewsCategories();
	const tagIds = await seedTags();
	const articleIds = await seedArticles(reporterIds, rootIds, childIds, tagIds);
	await seedArticlePositions(articleIds);
	console.log("✅ Seeding completed!");
	await pool.end();
}

seed().catch((err) => {
	console.error("❌ Seeding error:", err);
	pool.end();
});
