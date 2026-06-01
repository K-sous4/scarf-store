"""
Dados de desenvolvimento (mockup) em português.
Popula: categorias, cores, materiais, produtos e PIX.
Ignora se já existir dado na tabela.
"""

import logging
from sqlalchemy.orm import Session
from models.category import Category
from models.color import Color
from models.material import Material
from models.product import Product
from models.payment_settings import PaymentSettings

logger = logging.getLogger(__name__)


# ── Categorias ────────────────────────────────────────────────────────────────

CATEGORIES = [
    {
        "name": "Lenços de Seda",
        "slug": "lencos-de-seda",
        "description": "Lenços de seda com estampas vibrantes e caimento suave.",
        "is_active": True,
    },
    {
        "name": "Lenços de Lã",
        "slug": "lencos-de-la",
        "description": "Lenços quentes de lã para o frio.",
        "is_active": True,
    },
    {
        "name": "Lenços de Algodão",
        "slug": "lencos-de-algodao",
        "description": "Lenços leves e respiráveis para o dia a dia.",
        "is_active": True,
    },
    {
        "name": "Cashmere",
        "slug": "cashmere",
        "description": "Peças premium em cashmere, macias e elegantes.",
        "is_active": True,
    },
]


# ── Cores ─────────────────────────────────────────────────────────────────────

COLORS = [
    {"name": "Marfim", "hex_code": "#FFFFF0"},
    {"name": "Preto", "hex_code": "#000000"},
    {"name": "Bordô", "hex_code": "#800020"},
    {"name": "Azul Marinho", "hex_code": "#001F5B"},
    {"name": "Verde Floresta", "hex_code": "#228B22"},
    {"name": "Terracota", "hex_code": "#E2725B"},
]


# ── Materiais ─────────────────────────────────────────────────────────────────

MATERIALS = [
    {
        "name": "Seda",
        "slug": "seda",
        "description": "Fibra natural com brilho suave e caimento fluido.",
        "is_active": True,
    },
    {
        "name": "Lã",
        "slug": "la",
        "description": "Fibra quente e confortável para temperaturas baixas.",
        "is_active": True,
    },
    {
        "name": "Algodão",
        "slug": "algodao",
        "description": "Fibra leve, respirável e fácil de cuidar.",
        "is_active": True,
    },
    {
        "name": "Cashmere",
        "slug": "cashmere",
        "description": "Lã fina e macia, ideal para peças de luxo.",
        "is_active": True,
    },
]


# ── Produtos ──────────────────────────────────────────────────────────────────

PRODUCTS = [
    {
        "sku": "SC-SLK-001",
        "name": "Lenço de Seda Floral Clássico",
        "short_description": "Estampa floral em seda pura. Peça atemporal.",
        "description": (
            "Lenço em seda charmeuse com motivo floral inspirado em jardins. "
            "Caimento fluido e brilho discreto — funciona no pescoço, cabelo ou bolsa."
        ),
        "category": "Lenços de Seda",
        "subcategory": "Estampado",
        "tags": ["seda", "floral", "presente"],
        "price": 89.90,
        "cost": 32.00,
        "discount_percentage": 0,
        "stock": 25,
        "low_stock_threshold": 5,
        "reserved_stock": 0,
        "available_stock": 25,
        "length": 180.0,
        "width": 45.0,
        "weight": 0.08,
        "material": "Seda",
        "color": "Marfim",
        "size": "180x45cm",
        "is_active": True,
        "is_featured": True,
        "is_new": False,
        "images": ["https://placehold.co/600x400/f4f4f5/71717a?text=Lenço+Seda"],
        "specifications": {"tecelagem": "Charmeuse", "momme": 16},
        "attributes": {"cuidados": "Limpeza a seco"},
    },
    {
        "sku": "SC-WOL-001",
        "name": "Lenço de Lã Xadrez",
        "short_description": "Xadrez clássico em lã merino. Quente e elegante.",
        "description": (
            "Lenço de lã merino com padrão xadrez em tons bordô e verde. "
            "Tamanho generoso para enrolar com conforto no inverno."
        ),
        "category": "Lenços de Lã",
        "subcategory": "Xadrez",
        "tags": ["la", "xadrez", "inverno"],
        "price": 69.90,
        "cost": 22.00,
        "discount_percentage": 0,
        "stock": 30,
        "low_stock_threshold": 6,
        "reserved_stock": 0,
        "available_stock": 30,
        "length": 200.0,
        "width": 30.0,
        "weight": 0.22,
        "material": "Lã",
        "color": "Bordô",
        "size": "200x30cm",
        "is_active": True,
        "is_featured": True,
        "is_new": False,
        "images": ["https://placehold.co/600x400/f4f4f5/71717a?text=Lenço+Lã"],
        "specifications": {"tipo": "Lã merino extra fina"},
        "attributes": {"cuidados": "Lavar à mão em água fria"},
    },
    {
        "sku": "SC-CSH-001",
        "name": "Xale de Cashmere Premium",
        "short_description": "Cashmere puro, macio como nuvem.",
        "description": (
            "Xale em cashmere de alta qualidade, leve e versátil. "
            "Serve como lenço largo ou envoltório nos ombros."
        ),
        "category": "Cashmere",
        "subcategory": "Xale",
        "tags": ["cashmere", "luxo", "presente"],
        "price": 189.90,
        "cost": 75.00,
        "discount_percentage": 0,
        "stock": 12,
        "low_stock_threshold": 3,
        "reserved_stock": 0,
        "available_stock": 12,
        "length": 200.0,
        "width": 70.0,
        "weight": 0.15,
        "material": "Cashmere",
        "color": "Terracota",
        "size": "200x70cm",
        "is_active": True,
        "is_featured": True,
        "is_new": False,
        "images": ["https://placehold.co/600x400/f4f4f5/71717a?text=Cashmere"],
        "specifications": {"gramatura": "2 fios"},
        "attributes": {"cuidados": "Limpeza a seco recomendada"},
    },
    {
        "sku": "SC-CTN-001",
        "name": "Bandana de Algodão Listrada",
        "short_description": "Listras em algodão. Casual e versátil.",
        "description": (
            "Bandana listrada em algodão orgânico. Use no pescoço, "
            "cabeça ou bolsa — leve e confortável no dia a dia."
        ),
        "category": "Lenços de Algodão",
        "subcategory": "Bandana",
        "tags": ["algodao", "casual", "verao"],
        "price": 29.90,
        "cost": 9.00,
        "discount_percentage": 0,
        "stock": 50,
        "low_stock_threshold": 10,
        "reserved_stock": 0,
        "available_stock": 50,
        "length": 60.0,
        "width": 60.0,
        "weight": 0.05,
        "material": "Algodão",
        "color": "Azul Marinho",
        "size": "60x60cm",
        "is_active": True,
        "is_featured": False,
        "is_new": True,
        "images": ["https://placehold.co/600x400/f4f4f5/71717a?text=Bandana"],
        "specifications": {"tecelagem": "Plana"},
        "attributes": {"cuidados": "Máquina 40°C"},
    },
    {
        "sku": "SC-CTN-002",
        "name": "Lenço de Algodão Estampa Tropical",
        "short_description": "Estampa tropical leve. Ideal para o verão.",
        "description": (
            "Lenço de algodão com estampa tropical em tons de coral. "
            "Grande e leve — também funciona como pareô na praia."
        ),
        "category": "Lenços de Algodão",
        "subcategory": "Estampado",
        "tags": ["algodao", "tropical", "verao"],
        "price": 39.90,
        "cost": 12.00,
        "discount_percentage": 10,
        "discount_price": 35.91,
        "stock": 35,
        "low_stock_threshold": 8,
        "reserved_stock": 0,
        "available_stock": 35,
        "length": 160.0,
        "width": 50.0,
        "weight": 0.07,
        "material": "Algodão",
        "color": "Terracota",
        "size": "160x50cm",
        "is_active": True,
        "is_featured": False,
        "is_new": True,
        "images": ["https://placehold.co/600x400/f4f4f5/71717a?text=Tropical"],
        "specifications": {"estampa": "Digital"},
        "attributes": {"cuidados": "Máquina 30°C, não usar secadora"},
    },
]

SEED_SKUS = [item["sku"] for item in PRODUCTS]


# ── Seed functions ────────────────────────────────────────────────────────────

def cleanup_test_products(db: Session) -> int:
    """Remove produtos criados pelos testes automatizados (SKU TEST-*)."""
    removed = (
        db.query(Product)
        .filter(
            (Product.sku.like("TEST-%")) | (Product.name == "Lenço Teste")
        )
        .delete(synchronize_session=False)
    )
    if removed:
        db.commit()
        logger.info("✓ %d produto(s) de teste removido(s) do catalogo.", removed)
    return removed

def seed_categories(db: Session) -> None:
    if db.query(Category).first():
        logger.info("✓ Categorias já existem — ignorando seed.")
        return
    for data in CATEGORIES:
        db.add(Category(**data))
    db.commit()
    logger.info(f"✓ {len(CATEGORIES)} categorias inseridas.")


def seed_colors(db: Session) -> None:
    if db.query(Color).first():
        logger.info("✓ Cores já existem — ignorando seed.")
        return
    for data in COLORS:
        db.add(Color(**data))
    db.commit()
    logger.info(f"✓ {len(COLORS)} cores inseridas.")


def seed_materials(db: Session) -> None:
    if db.query(Material).first():
        logger.info("✓ Materiais já existem — ignorando seed.")
        return
    for data in MATERIALS:
        db.add(Material(**data))
    db.commit()
    logger.info(f"✓ {len(MATERIALS)} materiais inseridos.")


def seed_products(db: Session) -> None:
    cleanup_test_products(db)

    existing_skus = {
        row[0]
        for row in db.query(Product.sku).filter(Product.sku.in_(SEED_SKUS)).all()
    }
    inserted = 0
    for data in PRODUCTS:
        if data["sku"] in existing_skus:
            continue
        db.add(Product(**data))
        inserted += 1

    if inserted:
        db.commit()
        logger.info("✓ %d produto(s) do catalogo inseridos.", inserted)
    else:
        logger.info("✓ Catalogo de produtos do seed ja esta completo (%d itens).", len(SEED_SKUS))


def seed_payment_settings(db: Session) -> None:
    if db.query(PaymentSettings).first():
        logger.info("✓ Configuração de pagamento já existe — ignorando seed.")
        return
    db.add(PaymentSettings(phone_number="13996257178", delivery_commitment_days=7))
    db.commit()
    logger.info("✓ Configuração PIX inserida.")


def seed_mockup(db: Session) -> None:
    """Executa todos os seeds de mockup (idempotente por tabela)."""
    logger.info("Inserindo dados de desenvolvimento...")
    cleanup_test_products(db)
    seed_payment_settings(db)
    seed_categories(db)
    seed_colors(db)
    seed_materials(db)
    seed_products(db)
    logger.info("✓ Seed de desenvolvimento concluído.")
