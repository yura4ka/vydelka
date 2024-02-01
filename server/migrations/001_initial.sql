-- +goose Up

CREATE TYPE language_type AS ENUM ('english', 'ukrainian');

CREATE TYPE delivery_type AS ENUM ('delivery', 'self');

CREATE TYPE pay_type AS ENUM ('pay_now', 'pay_receive');

-- +goose StatementBegin
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = Now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

-- +goose StatementBegin
CREATE OR REPLACE FUNCTION generate_tsvector(lang language_type, title VARCHAR(256), description TEXT)
RETURNS tsvector AS $$
  SELECT to_tsvector(lang::TEXT::REGCONFIG, title || ' ' || description);
$$ LANGUAGE sql IMMUTABLE;
-- +goose StatementEnd

CREATE TABLE translation_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY
);

CREATE TABLE translations (
  item_id UUID NOT NULL REFERENCES translation_items(id) ON DELETE CASCADE,
  lang language_type NOT NULL,
  content TEXT NOT NULL,
  PRIMARY KEY (item_id, lang)
);

CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title_translation_item UUID NOT NULL REFERENCES translation_items(id) ON DELETE CASCADE,
  slug VARCHAR(64) NOT NULL UNIQUE,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL
);

CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  slug VARCHAR(256) NOT NULL,
  price DECIMAL NOT NULL CHECK(price > 0),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE(slug, category_id)
);

CREATE TABLE product_translations (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  lang language_type NOT NULL,
  title VARCHAR(256) NOT NULL,
  description TEXT NOT NULL CHECK(LENGTH(description) <= 16384),
  search tsvector GENERATED ALWAYS AS (generate_tsvector(lang, title, description)) STORED,
  PRIMARY KEY (product_id, lang)
);

CREATE INDEX product_tsv_idx ON product_translations USING GIN (search);

CREATE TABLE filters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title_translation_item UUID NOT NULL REFERENCES translation_items(id) ON DELETE CASCADE,
  slug VARCHAR(64) NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE(slug, category_id)
);

CREATE TABLE filter_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(64) NOT NULL,
  variant_translation_item UUID NOT NULL REFERENCES translation_items(id) ON DELETE CASCADE,
  filter_id UUID NOT NULL REFERENCES filters(id) ON DELETE CASCADE,
  UNIQUE(slug, filter_id)
);

CREATE TABLE product_filters (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES filter_variants(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, variant_id)
);

CREATE TABLE product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  width INT NOT NULL,
  height INT NOT NULL
);

CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  first_name VARCHAR(128) NOT NULL,
  last_name VARCHAR(128) NOT NULL,
  email VARCHAR(128) UNIQUE NOT NULL,
  phone VARCHAR(16) UNIQUE NOT NULL,
  password TEXT NOT NULL
);

CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivery delivery_type NOT NULL,
  delivery_address TEXT,
  pay pay_type NOT NULL,
  payment_time TIMESTAMPTZ,
  region TEXT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_orders_user ON orders (user_id);

ALTER TABLE orders ADD CONSTRAINT delivery_has_address 
CHECK (
	delivery = 'delivery' AND delivery_address IS NOT NULL
	OR delivery != 'delivery'
);

CREATE TABLE order_content (
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK(quantity > 0),
  PRIMARY KEY (order_id, product_id)
);

CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  content TEXT NOT NULL CHECK(LENGTH(content) <= 10000),
  rating SMALLINT NOT NULL CHECK(rating >= 0 AND rating <= 5),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE
);

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

-- +goose Down

DROP TYPE IF EXISTS language_type CASCADE;
DROP TYPE IF EXISTS delivery_type CASCADE;
DROP TYPE IF EXISTS pay_type CASCADE;

DROP FUNCTION IF EXISTS on_post_change CASCADE;
DROP FUNCTION IF EXISTS generate_tsvector CASCADE;

DROP TABLE IF EXISTS 
  products, product_translations, categories, filters, filter_variants,
  product_filters, product_images, users, orders, order_content, reviews,
  translation_items, translations
CASCADE;