INSERT INTO products (id, name, price, photo_url, description)
VALUES (
    'b6ed8dd3-03d6-4b7e-8a92-659f5cbdde78',
    'MW75 Custom Wireless ANC Headphones',
    8999000,
    '/images/headphone-matte-black.jpg.jpeg',
    'Headphone over-ear premium dengan ANC dan opsi engraving.'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    photo_url = EXCLUDED.photo_url,
    description = EXCLUDED.description,
    updated_at = NOW();

INSERT INTO product_variants (id, product_id, name, photo_url, quantity)
VALUES
    ('a646e0d9-b7c8-48aa-85cd-f388f95be101', 'b6ed8dd3-03d6-4b7e-8a92-659f5cbdde78', 'Matte Black', '/images/headphone-matte-black.jpg.jpeg', 4),
    ('a646e0d9-b7c8-48aa-85cd-f388f95be102', 'b6ed8dd3-03d6-4b7e-8a92-659f5cbdde78', 'Gunmetal', '/images/headphone-gunmetal.jpg.jpeg', 4),
    ('a646e0d9-b7c8-48aa-85cd-f388f95be103', 'b6ed8dd3-03d6-4b7e-8a92-659f5cbdde78', 'Silver', '/images/headphone-silver.jpg.jpeg', 4)
ON CONFLICT (product_id, name) DO UPDATE SET
    photo_url = EXCLUDED.photo_url,
    quantity = EXCLUDED.quantity,
    updated_at = NOW();
