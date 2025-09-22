import "dotenv/config";
import { Faker, vi, en } from "@faker-js/faker";
import pkg from "pg";
import bcrypt from "bcrypt";
import { nanoid } from "../src/lib/nanoid.ts";
import { fakeTiptapDoc } from "./fakeTiptapDoc.ts";
import cliProgress from "cli-progress";
import { pipeline } from "stream";
import { promisify } from "util";
import { Readable } from "stream";
import copyStreams from "pg-copy-streams";

const { Pool } = pkg;
const { from: copyFrom } = copyStreams;
const faker = new Faker({ locale: [vi, en] });
const asyncPipeline = promisify(pipeline);

const pool = new Pool({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: Number(process.env.DB_PORT),
});

const config = {
	users: 10,
	tags: 10,
	articles: 2_000_000, // số lượng articles
	maxTagsPerArticle: 5,
};

// ==================== Helpers ====================
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
		const full_name = faker.person.fullName();
		const email = faker.internet.email();
		const role = faker.helpers.arrayElement(["reporter", "reader", "admin"]);
		const avatar_url = faker.image.avatar();

		const { rows } = await pool.query(
			`INSERT INTO users (username, password_hash, full_name, email, role, avatar_url)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT DO NOTHING RETURNING id, role`,
			[username, passwordHash, full_name, email, role, avatar_url],
		);

		if (rows[0] && rows[0].role === "reporter") reporterIds.push(rows[0].id);
	}
	return reporterIds;
}

// ==================== Seed Categories ====================
const ROOT_CATEGORIES = [
	"Thế giới", "Kinh tế", "Giải trí", "Thể thao",
	"Công nghệ", "Sức khỏe", "Văn hóa", "Giáo dục",
];

async function seedCategories(): Promise<{ root: number[]; children: number[] }> {
	const rootIds: number[] = [];
	const childIds: number[] = [];

	for (let i = 0; i < ROOT_CATEGORIES.length; i++) {
		const name = ROOT_CATEGORIES[i];
		const slug = slugify(name);

		const { rows } = await pool.query(
			`INSERT INTO categories (name, slug, description, position, is_active, meta_title, meta_description, parent_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name
       RETURNING id`,
			[name, slug, faker.lorem.sentence(), i, true, name, name, null],
		);

		const rootId = rows[0].id;
		rootIds.push(rootId);

		// thêm children
		const childCount = faker.number.int({ min: 4, max: 7 });
		for (let j = 0; j < childCount; j++) {
			const cname = faker.lorem.words(2);
			const cslug = slugify(cname);

			const { rows: cRows } = await pool.query(
				`INSERT INTO categories (name, slug, description, position, is_active, meta_title, meta_description, parent_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT DO NOTHING RETURNING id`,
				[cname, cslug, faker.lorem.sentence(), j, true, cname, cname, rootId],
			);

			if (cRows[0]) childIds.push(cRows[0].id);
		}
	}
	return { root: rootIds, children: childIds };
}

// ==================== Seed Tags ====================
async function seedTags(): Promise<number[]> {
	const tagIds: number[] = [];
	for (let i = 0; i < config.tags; i++) {
		const { rows } = await pool.query(
			`INSERT INTO tags (name) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id`,
			[faker.lorem.word()],
		);
		if (rows[0]) tagIds.push(rows[0].id);
	}
	return tagIds;
}

// ==================== Seed Articles (BATCH INSERT) ====================
async function seedArticlesBatch(reporterIds: string[], rootIds: number[], childIds: number[], tagIds: number[]) {
	const ARTICLE_BATCH = 5000;
	const total = config.articles;
	const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
	bar.start(total, 0);

	for (let i = 0; i < total; i += ARTICLE_BATCH) {
		const chunk = [];
		for (let j = 0; j < ARTICLE_BATCH && i + j < total; j++) {
			const id = nanoid();
			const author_id = faker.helpers.arrayElement(reporterIds);
			const created_at = faker.date.recent({ days: 30 });
			const title = faker.lorem.sentence();
			const short_description = faker.lorem.paragraph();
			const status = faker.helpers.arrayElement(["draft", "published"]);
			const content = fakeTiptapDoc();
			const category_id = (faker.datatype.boolean() && childIds.length > 0)
				? faker.helpers.arrayElement(childIds)
				: faker.helpers.arrayElement(rootIds);

			chunk.push([
				id, author_id, category_id, title, short_description,
				created_at.toISOString(), faker.image.url(), status, content,
				status === "published" ? created_at.toISOString() : null
			]);
		}

		const placeholders = chunk.map((_, j) =>
			`($${j * 10 + 1},$${j * 10 + 2},$${j * 10 + 3},$${j * 10 + 4},$${j * 10 + 5},$${j * 10 + 6},$${j * 10 + 7},$${j * 10 + 8},$${j * 10 + 9},$${j * 10 + 10})`
		).join(",");

		await pool.query("BEGIN");
		try {
			await pool.query(
				`INSERT INTO articles (id, author_id, category_id, title, short_description, created_at, thumbnail_url, status, content, published_at)
         VALUES ${placeholders}`,
				chunk.flat()
			);
			await pool.query("COMMIT");
		} catch (err) {
			await pool.query("ROLLBACK");
			throw err;
		}

		bar.update(Math.min(i + ARTICLE_BATCH, total));
	}

	bar.stop();
	console.log("Seed articles (batch insert) completed!");
}

// ==================== Reset Database ====================
async function resetDb() {
	console.log("Reset database...");
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
	console.log("Reset completed!");
}

// ==================== Main ====================
async function seed() {
	if (process.argv.includes("--reset")) {
		await resetDb();
	}

	const reporterIds = await seedUsers();
	const { root, children } = await seedCategories();
	const tagIds = await seedTags();

	await seedArticlesBatch(reporterIds, root, children, tagIds);

	await pool.end();
}

seed().catch((err) => {
	console.error("Seeding error:", err);
	pool.end();
});

