"""
Mockup seed data for development environment.
Populates: categories, colors, materials, products.
Skips gracefully if data already exists.
"""

import logging
from sqlalchemy.orm import Session
from models.category import Category
from models.color import Color
from models.material import Material
from models.product import Product

logger = logging.getLogger(__name__)


# ── Categories ────────────────────────────────────────────────────────────────

CATEGORIES = [
    {
        "name": "Silk Scarves",
        "slug": "silk-scarves",
        "description": "Luxurious silk scarves with vibrant prints and smooth texture.",
        "is_active": True,
    },
    {
        "name": "Wool Scarves",
        "slug": "wool-scarves",
        "description": "Warm and cozy wool scarves perfect for cold seasons.",
        "is_active": True,
    },
    {
        "name": "Cotton Scarves",
        "slug": "cotton-scarves",
        "description": "Lightweight and breathable cotton scarves for all seasons.",
        "is_active": True,
    },
    {
        "name": "Cashmere Scarves",
        "slug": "cashmere-scarves",
        "description": "Ultra-soft cashmere scarves of exceptional quality.",
        "is_active": True,
    },
    {
        "name": "Printed Scarves",
        "slug": "printed-scarves",
        "description": "Scarves featuring bold patterns, florals, and artistic prints.",
        "is_active": True,
    },
    {
        "name": "Solid Colour Scarves",
        "slug": "solid-colour-scarves",
        "description": "Classic single-tone scarves to complement any outfit.",
        "is_active": True,
    },
    {
        "name": "Accessories",
        "slug": "accessories",
        "description": "Complementary accessories for scarf lovers.",
        "is_active": True,
    },
]


# ── Colors ────────────────────────────────────────────────────────────────────

COLORS = [
    {"name": "Ivory",        "hex_code": "#FFFFF0"},
    {"name": "Black",        "hex_code": "#000000"},
    {"name": "White",        "hex_code": "#FFFFFF"},
    {"name": "Burgundy",     "hex_code": "#800020"},
    {"name": "Navy Blue",    "hex_code": "#001F5B"},
    {"name": "Coral",        "hex_code": "#FF6B6B"},
    {"name": "Forest Green", "hex_code": "#228B22"},
    {"name": "Camel",        "hex_code": "#C19A6B"},
    {"name": "Dusty Rose",   "hex_code": "#DCAE96"},
    {"name": "Midnight Blue","hex_code": "#191970"},
    {"name": "Sage",         "hex_code": "#BCB88A"},
    {"name": "Terracotta",   "hex_code": "#E2725B"},
    {"name": "Lavender",     "hex_code": "#E6E6FA"},
    {"name": "Mustard",      "hex_code": "#FFDB58"},
    {"name": "Charcoal",     "hex_code": "#36454F"},
]


# ── Materials ─────────────────────────────────────────────────────────────────

MATERIALS = [
    {
        "name": "Silk",
        "slug": "silk",
        "description": "Natural protein fibre with a lustrous sheen and smooth drape. Lightweight and temperature-regulating.",
        "is_active": True,
    },
    {
        "name": "Wool",
        "slug": "wool",
        "description": "Natural animal fibre known for warmth and moisture-wicking properties. Ideal for cold weather.",
        "is_active": True,
    },
    {
        "name": "Cashmere",
        "slug": "cashmere",
        "description": "Premium fine wool from cashmere goats. Exceptionally soft, lightweight, and insulating.",
        "is_active": True,
    },
    {
        "name": "Cotton",
        "slug": "cotton",
        "description": "Natural plant-based fibre. Breathable, hypoallergenic, and easy to care for.",
        "is_active": True,
    },
    {
        "name": "Viscose",
        "slug": "viscose",
        "description": "Semi-synthetic fibre derived from wood pulp. Silky feel at an accessible price point.",
        "is_active": True,
    },
    {
        "name": "Modal",
        "slug": "modal",
        "description": "High-tenacity viscose fibre, softer than cotton and resistant to shrinkage.",
        "is_active": True,
    },
    {
        "name": "Linen",
        "slug": "linen",
        "description": "Natural fibre from the flax plant. Crisp texture with excellent breathability for summer.",
        "is_active": True,
    },
    {
        "name": "Silk-Wool Blend",
        "slug": "silk-wool-blend",
        "description": "A blend combining silk's lustre with wool's warmth for an elegant all-season option.",
        "is_active": True,
    },
]


# ── Products ──────────────────────────────────────────────────────────────────

PRODUCTS = [
    # Silk
    {
        "sku": "SC-SLK-001",
        "name": "Classic Floral Silk Scarf",
        "short_description": "Vibrant floral print on pure silk. A timeless wardrobe staple.",
        "description": (
            "Crafted from the finest Charmeuse silk, this scarf features a hand-painted floral motif "
            "inspired by blooming gardens. Its fluid drape and subtle sheen make it equally stunning "
            "as a neck wrap, hair accessory, or bag accent."
        ),
        "category": "Silk Scarves",
        "subcategory": "Printed",
        "tags": ["silk", "floral", "luxury", "gift"],
        "price": 89.90,
        "cost": 32.00,
        "discount_percentage": 0,
        "stock": 45,
        "low_stock_threshold": 8,
        "reserved_stock": 0,
        "available_stock": 45,
        "length": 180.0,
        "width": 45.0,
        "weight": 0.08,
        "material": "Silk",
        "color": "Ivory",
        "size": "180x45cm",
        "is_active": True,
        "is_featured": True,
        "is_new": False,
        "images": ["https://placehold.co/600x400?text=Silk+Scarf"],
        "specifications": {"weave": "Charmeuse", "momme": 16},
        "attributes": {"care": "Dry clean only"},
    },
    {
        "sku": "SC-SLK-002",
        "name": "Geometric Ivory Silk Scarf",
        "short_description": "Bold geometric pattern on ivory silk. Modern elegance.",
        "description": (
            "An ivory silk scarf featuring a striking geometric print in navy and gold tones. "
            "Machine-hemmed edges and a featherlight hand make it versatile for any occasion."
        ),
        "category": "Silk Scarves",
        "subcategory": "Printed",
        "tags": ["silk", "geometric", "modern", "ivory"],
        "price": 79.90,
        "cost": 28.00,
        "discount_percentage": 10,
        "discount_price": 71.91,
        "stock": 30,
        "low_stock_threshold": 5,
        "reserved_stock": 2,
        "available_stock": 28,
        "length": 170.0,
        "width": 45.0,
        "weight": 0.075,
        "material": "Silk",
        "color": "Ivory",
        "size": "170x45cm",
        "is_active": True,
        "is_featured": False,
        "is_new": True,
        "images": ["https://placehold.co/600x400?text=Geometric+Silk"],
        "specifications": {"weave": "Twill", "momme": 14},
        "attributes": {"care": "Hand wash cold"},
    },
    # Wool
    {
        "sku": "SC-WOL-001",
        "name": "Heritage Plaid Wool Scarf",
        "short_description": "Classic tartan plaid in merino wool. Cosy and stylish.",
        "description": (
            "Inspired by Scottish highland traditions, this merino wool scarf features a timeless "
            "tartan plaid in burgundy and forest green. Generously sized to wrap and drape with ease."
        ),
        "category": "Wool Scarves",
        "subcategory": "Plaid",
        "tags": ["wool", "plaid", "tartan", "winter", "merino"],
        "price": 69.90,
        "cost": 22.00,
        "discount_percentage": 0,
        "stock": 60,
        "low_stock_threshold": 10,
        "reserved_stock": 0,
        "available_stock": 60,
        "length": 200.0,
        "width": 30.0,
        "weight": 0.22,
        "material": "Wool",
        "color": "Burgundy",
        "size": "200x30cm",
        "is_active": True,
        "is_featured": True,
        "is_new": False,
        "images": ["https://placehold.co/600x400?text=Plaid+Wool"],
        "specifications": {"grade": "Extra Fine Merino", "micron": 18},
        "attributes": {"care": "Machine wash gentle cold"},
    },
    {
        "sku": "SC-WOL-002",
        "name": "Ribbed Charcoal Wool Scarf",
        "short_description": "Chunky ribbed knit in charcoal grey. Essential winter warmth.",
        "description": (
            "A sophisticated ribbed-knit scarf in deep charcoal, made from 100% pure new wool. "
            "The open-knit texture adds visual interest while remaining breathable enough for layering."
        ),
        "category": "Wool Scarves",
        "subcategory": "Knit",
        "tags": ["wool", "knit", "winter", "unisex", "charcoal"],
        "price": 59.90,
        "cost": 18.50,
        "discount_percentage": 0,
        "stock": 40,
        "low_stock_threshold": 8,
        "reserved_stock": 1,
        "available_stock": 39,
        "length": 190.0,
        "width": 25.0,
        "weight": 0.18,
        "material": "Wool",
        "color": "Charcoal",
        "size": "190x25cm",
        "is_active": True,
        "is_featured": False,
        "is_new": False,
        "images": ["https://placehold.co/600x400?text=Ribbed+Wool"],
        "specifications": {"knit": "2x2 Rib", "ply": "4-ply"},
        "attributes": {"care": "Hand wash cold, reshape while damp"},
    },
    # Cashmere
    {
        "sku": "SC-CSH-001",
        "name": "Signature Cashmere Wrap",
        "short_description": "Pure Grade-A cashmere wrap. Cloud-soft and luxurious.",
        "description": (
            "Our flagship cashmere wrap is woven from Grade-A Mongolian cashmere fibres, "
            "resulting in a piece that is impossibly soft, weightless, and endlessly versatile. "
            "Large enough to wear as a shawl or wrap around the shoulders."
        ),
        "category": "Cashmere Scarves",
        "subcategory": "Wrap",
        "tags": ["cashmere", "luxury", "gift", "wrap", "premium"],
        "price": 189.90,
        "cost": 75.00,
        "discount_percentage": 0,
        "stock": 20,
        "low_stock_threshold": 4,
        "reserved_stock": 0,
        "available_stock": 20,
        "length": 200.0,
        "width": 70.0,
        "weight": 0.15,
        "material": "Cashmere",
        "color": "Camel",
        "size": "200x70cm",
        "is_active": True,
        "is_featured": True,
        "is_new": False,
        "images": ["https://placehold.co/600x400?text=Cashmere+Wrap"],
        "specifications": {"grade": "Grade A", "ply": "2-ply", "micron": 15},
        "attributes": {"care": "Dry clean or hand wash cold in cashmere shampoo"},
    },
    {
        "sku": "SC-CSH-002",
        "name": "Dusty Rose Cashmere Scarf",
        "short_description": "Delicate dusty rose in featherlight cashmere.",
        "description": (
            "A refined cashmere scarf in a muted dusty rose tone, finished with hand-knotted "
            "fringe at both ends. Lightweight enough to wear year-round, warm enough for cool evenings."
        ),
        "category": "Cashmere Scarves",
        "subcategory": "Solid",
        "tags": ["cashmere", "pink", "luxury", "gift", "fringe"],
        "price": 149.90,
        "cost": 58.00,
        "discount_percentage": 15,
        "discount_price": 127.42,
        "stock": 18,
        "low_stock_threshold": 4,
        "reserved_stock": 0,
        "available_stock": 18,
        "length": 180.0,
        "width": 55.0,
        "weight": 0.12,
        "material": "Cashmere",
        "color": "Dusty Rose",
        "size": "180x55cm",
        "is_active": True,
        "is_featured": True,
        "is_new": True,
        "images": ["https://placehold.co/600x400?text=Rose+Cashmere"],
        "specifications": {"grade": "Grade A", "ply": "2-ply"},
        "attributes": {"finish": "Hand-knotted fringe", "care": "Dry clean recommended"},
    },
    # Cotton
    {
        "sku": "SC-CTN-001",
        "name": "Striped Cotton Bandana Scarf",
        "short_description": "Multi-way striped cotton scarf. Casual and effortless.",
        "description": (
            "A versatile striped cotton scarf in navy and white. Wear it as a bandana, neckerchief, "
            "or headband. Made from 100% organic cotton — gentle on skin and the environment."
        ),
        "category": "Cotton Scarves",
        "subcategory": "Bandana",
        "tags": ["cotton", "organic", "casual", "stripe", "summer"],
        "price": 29.90,
        "cost": 9.00,
        "discount_percentage": 0,
        "stock": 120,
        "low_stock_threshold": 20,
        "reserved_stock": 5,
        "available_stock": 115,
        "length": 60.0,
        "width": 60.0,
        "weight": 0.05,
        "material": "Cotton",
        "color": "Navy Blue",
        "size": "60x60cm",
        "is_active": True,
        "is_featured": False,
        "is_new": False,
        "images": ["https://placehold.co/600x400?text=Cotton+Bandana"],
        "specifications": {"weave": "Plain", "thread_count": 120},
        "attributes": {"care": "Machine wash 40°C", "certification": "GOTS Organic"},
    },
    {
        "sku": "SC-CTN-002",
        "name": "Tropical Print Cotton Scarf",
        "short_description": "Bright tropical print lightweight cotton. Summer essential.",
        "description": (
            "A playful tropical print cotton scarf featuring palm leaves and exotic florals "
            "in vibrant coral tones. Large and lightweight — doubles as a beach wrap."
        ),
        "category": "Printed Scarves",
        "subcategory": "Tropical",
        "tags": ["cotton", "tropical", "summer", "beach", "print"],
        "price": 39.90,
        "cost": 12.00,
        "discount_percentage": 0,
        "stock": 75,
        "low_stock_threshold": 15,
        "reserved_stock": 0,
        "available_stock": 75,
        "length": 160.0,
        "width": 50.0,
        "weight": 0.07,
        "material": "Cotton",
        "color": "Coral",
        "size": "160x50cm",
        "is_active": True,
        "is_featured": False,
        "is_new": True,
        "images": ["https://placehold.co/600x400?text=Tropical+Print"],
        "specifications": {"print": "Digital reactive print"},
        "attributes": {"care": "Machine wash 30°C, do not tumble dry"},
    },
    # Viscose
    {
        "sku": "SC-VIS-001",
        "name": "Ombre Lavender Viscose Scarf",
        "short_description": "Dreamy lavender ombre effect on fluid viscose.",
        "description": (
            "A dreamy hand-dyed ombre viscose scarf transitioning from deep violet to pale lavender. "
            "The fluid drape and subtle sheen bring instant elegance to any outfit."
        ),
        "category": "Printed Scarves",
        "subcategory": "Ombre",
        "tags": ["viscose", "ombre", "purple", "lavender", "spring"],
        "price": 49.90,
        "cost": 15.00,
        "discount_percentage": 20,
        "discount_price": 39.92,
        "stock": 55,
        "low_stock_threshold": 10,
        "reserved_stock": 3,
        "available_stock": 52,
        "length": 175.0,
        "width": 50.0,
        "weight": 0.09,
        "material": "Viscose",
        "color": "Lavender",
        "size": "175x50cm",
        "is_active": True,
        "is_featured": False,
        "is_new": False,
        "images": ["https://placehold.co/600x400?text=Ombre+Lavender"],
        "specifications": {"dye": "Hand-dyed ombre"},
        "attributes": {"care": "Hand wash cold, line dry in shade"},
    },
    # Solid colour
    {
        "sku": "SC-SOL-001",
        "name": "Mustard Solid Lightweight Scarf",
        "short_description": "Rich mustard yellow solid scarf. A pop of colour for any look.",
        "description": (
            "A clean, unfussy solid scarf in warm mustard yellow made from a modal-cotton blend. "
            "Light enough for three-season wear, soft enough to wear directly against the skin."
        ),
        "category": "Solid Colour Scarves",
        "subcategory": "Solid",
        "tags": ["solid", "mustard", "modal", "casual", "autumn"],
        "price": 44.90,
        "cost": 13.50,
        "discount_percentage": 0,
        "stock": 80,
        "low_stock_threshold": 12,
        "reserved_stock": 0,
        "available_stock": 80,
        "length": 180.0,
        "width": 50.0,
        "weight": 0.1,
        "material": "Modal",
        "color": "Mustard",
        "size": "180x50cm",
        "is_active": True,
        "is_featured": False,
        "is_new": False,
        "images": ["https://placehold.co/600x400?text=Mustard+Solid"],
        "specifications": {"blend": "60% Modal, 40% Cotton"},
        "attributes": {"care": "Machine wash 30°C"},
    },
    {
        "sku": "SC-SOL-002",
        "name": "Sage Green Linen Scarf",
        "short_description": "Earthy sage linen scarf. Light and textured.",
        "description": (
            "A relaxed linen scarf in a muted sage green — perfect for warm days when you "
            "want a little extra coverage without overheating. Natural texture adds casual chicness."
        ),
        "category": "Solid Colour Scarves",
        "subcategory": "Solid",
        "tags": ["linen", "sage", "summer", "natural", "lightweight"],
        "price": 54.90,
        "cost": 16.00,
        "discount_percentage": 0,
        "stock": 50,
        "low_stock_threshold": 10,
        "reserved_stock": 0,
        "available_stock": 50,
        "length": 185.0,
        "width": 50.0,
        "weight": 0.11,
        "material": "Linen",
        "color": "Sage",
        "size": "185x50cm",
        "is_active": True,
        "is_featured": False,
        "is_new": True,
        "images": ["https://placehold.co/600x400?text=Sage+Linen"],
        "specifications": {"weave": "Plain linen"},
        "attributes": {"care": "Machine wash 40°C, tumble dry low"},
    },
    # Silk-Wool Blend
    {
        "sku": "SC-SWB-001",
        "name": "Terracotta Silk-Wool Blend Scarf",
        "short_description": "Warm terracotta tones in a luxurious silk-wool blend.",
        "description": (
            "This scarf combines the warmth of Merino wool with the drape and lustre of silk "
            "in a contemporary terracotta colourway. Perfectly balanced for transitional seasons."
        ),
        "category": "Wool Scarves",
        "subcategory": "Blend",
        "tags": ["silk", "wool", "blend", "terracotta", "autumn"],
        "price": 99.90,
        "cost": 38.00,
        "discount_percentage": 0,
        "stock": 35,
        "low_stock_threshold": 6,
        "reserved_stock": 1,
        "available_stock": 34,
        "length": 190.0,
        "width": 55.0,
        "weight": 0.14,
        "material": "Silk-Wool Blend",
        "color": "Terracotta",
        "size": "190x55cm",
        "is_active": True,
        "is_featured": True,
        "is_new": False,
        "images": ["https://placehold.co/600x400?text=Silk+Wool+Blend"],
        "specifications": {"blend": "50% Silk, 50% Merino Wool"},
        "attributes": {"care": "Dry clean recommended"},
    },
]


# ── Seed functions ────────────────────────────────────────────────────────────

def seed_categories(db: Session) -> None:
    if db.query(Category).first():
        logger.info("✓ Categories already seeded — skipping.")
        return
    for data in CATEGORIES:
        db.add(Category(**data))
    db.commit()
    logger.info(f"✓ {len(CATEGORIES)} categories seeded.")


def seed_colors(db: Session) -> None:
    if db.query(Color).first():
        logger.info("✓ Colors already seeded — skipping.")
        return
    for data in COLORS:
        db.add(Color(**data))
    db.commit()
    logger.info(f"✓ {len(COLORS)} colors seeded.")


def seed_materials(db: Session) -> None:
    if db.query(Material).first():
        logger.info("✓ Materials already seeded — skipping.")
        return
    for data in MATERIALS:
        db.add(Material(**data))
    db.commit()
    logger.info(f"✓ {len(MATERIALS)} materials seeded.")


def seed_products(db: Session) -> None:
    if db.query(Product).first():
        logger.info("✓ Products already seeded — skipping.")
        return
    for data in PRODUCTS:
        db.add(Product(**data))
    db.commit()
    logger.info(f"✓ {len(PRODUCTS)} products seeded.")


def seed_mockup(db: Session) -> None:
    """Run all mockup seeds. Safe to call multiple times — each seed is idempotent."""
    logger.info("Running mockup seed data...")
    seed_categories(db)
    seed_colors(db)
    seed_materials(db)
    seed_products(db)
    logger.info("✓ Mockup seed complete.")
