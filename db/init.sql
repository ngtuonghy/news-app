-- ========================================
-- FULL-RESET DATABASE + FULL-TEXT SEARCH READY SCHEMA
-- ========================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ================= Users =================
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(200),
    avatar_url TEXT,
    email VARCHAR(200) UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('reporter', 'reader', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================= Categories =================
DROP TABLE IF EXISTS categories CASCADE;
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) UNIQUE NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    parent_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    position INT DEFAULT 0,
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================= Tags =================
DROP TABLE IF EXISTS tags CASCADE;
CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================= Articles =================
DROP TRIGGER IF EXISTS tsvectorupdate ON articles;
DROP FUNCTION IF EXISTS articles_tsv_trigger();
DROP TABLE IF EXISTS articles CASCADE;

CREATE TABLE articles (
    id VARCHAR(36) PRIMARY KEY,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE,
    title TEXT,
    short_description TEXT,
    thumbnail_url TEXT,
    published_at TIMESTAMPTZ,
    content JSONB,
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'published', 'archived','scheduled', 'pending_review')) DEFAULT 'draft',
    view_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE,
    tsv tsvector
);

-- trigger fulltext
CREATE OR REPLACE FUNCTION articles_tsv_trigger() RETURNS trigger AS $$
BEGIN
  NEW.tsv :=
    setweight(to_tsvector('simple', coalesce(unaccent(NEW.title),'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(unaccent(NEW.short_description),'')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
ON articles FOR EACH ROW EXECUTE FUNCTION articles_tsv_trigger();

-- ================= Article Positions =================
DROP TABLE IF EXISTS article_positions CASCADE;
CREATE TABLE article_positions (
    id BIGSERIAL PRIMARY KEY,
    article_id VARCHAR(36) NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    section VARCHAR(50) NOT NULL CHECK (section IN ('home_page', 'category_page')),
    category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE,
    sort_order INT NOT NULL CHECK (sort_order >= 1),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_article_per_section UNIQUE (section, category_id, article_id),
    CONSTRAINT homepage_no_category CHECK (
        (section = 'home_page' AND category_id IS NULL)
        OR (section = 'category_page' AND category_id IS NOT NULL)
    )
);

-- ================= Article Tags =================
DROP TABLE IF EXISTS article_tags CASCADE;
CREATE TABLE article_tags (
    article_id VARCHAR(36) REFERENCES articles(id) ON DELETE CASCADE,
    tag_id BIGINT REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY(article_id, tag_id)
);

-- ==================== 2-level category enforcement ====================
DROP TRIGGER IF EXISTS trg_enforce_two_level_category ON categories;
DROP FUNCTION IF EXISTS enforce_two_level_category();

CREATE OR REPLACE FUNCTION enforce_two_level_category()
RETURNS TRIGGER AS $$
BEGIN
    -- Nếu NEW có parent_id, tức là muốn làm con
    IF NEW.parent_id IS NOT NULL THEN
        -- (1) Không cho phép 3 tầng: cha của nó không được là con
        IF EXISTS (
            SELECT 1 FROM categories WHERE id = NEW.parent_id AND parent_id IS NOT NULL
        ) THEN
            RAISE EXCEPTION '❌ Category "%" không hợp lệ: không được tạo category 3 tầng (chỉ root và con)', NEW.name;
        END IF;

        -- (2) Nếu category này đang có con rồi thì không thể biến nó thành con của ai
        IF EXISTS (
            SELECT 1 FROM categories WHERE parent_id = NEW.id
        ) THEN
            RAISE EXCEPTION '❌ Category "%" đã là cha, không thể gán làm con của category khác', NEW.name;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_two_level_category
BEFORE INSERT OR UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION enforce_two_level_category();

-- ==================== Indexes ====================
-- Full-text index cho articles
CREATE INDEX idx_articles_tsv ON articles USING GIN(tsv);

-- LIKE/ILIKE nhanh cho categories/tags
CREATE INDEX idx_categories_name_trgm ON categories USING GIN (name gin_trgm_ops);
CREATE INDEX idx_tags_name_trgm ON tags USING GIN (name gin_trgm_ops);

-- Index hỗ trợ article_positions
CREATE UNIQUE INDEX idx_homepage_sort ON article_positions(sort_order) WHERE section = 'home_page';
CREATE UNIQUE INDEX idx_categorypage_sort ON article_positions(category_id, sort_order) WHERE section = 'category_page';

