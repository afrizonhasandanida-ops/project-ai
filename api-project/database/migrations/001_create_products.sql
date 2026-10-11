CREATE TABLE products (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    price INTEGER NOT NULL CHECK (price >= 0),
    photo_url TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT products_name_not_blank CHECK (length(trim(name)) > 0),
    CONSTRAINT products_photo_url_not_blank CHECK (length(trim(photo_url)) > 0),
    CONSTRAINT products_description_not_blank CHECK (length(trim(description)) > 0)
);

CREATE TABLE product_variants (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(60) NOT NULL,
    photo_url TEXT,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT product_variants_name_not_blank CHECK (length(trim(name)) > 0),
    CONSTRAINT product_variants_product_name_unique UNIQUE (product_id, name)
);

CREATE UNIQUE INDEX product_variants_product_name_ci_unique
    ON product_variants (product_id, lower(name));
