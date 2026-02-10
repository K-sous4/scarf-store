from sqlalchemy import Column, Integer, String, Float, DateTime, func, Text, Boolean, Numeric, DECIMAL
from sqlalchemy.types import JSON
from database.db import Base
from datetime import datetime


class Product(Base):
    __tablename__ = "products"

    # Identificação
    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, index=True)  # Stock Keeping Unit - código único do produto
    
    # Informações básicas
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)  # Descrição longa
    short_description = Column(String(500))  # Descrição curta para listagem
    
    # Categorização
    category = Column(String(100), index=True)  # ex: "scarves", "accessories"
    subcategory = Column(String(100))  # ex: "silk_scarves", "wool_scarves"
    tags = Column(JSON)  # ex: ["red", "silk", "luxury"]
    
    # Preços
    price = Column(DECIMAL(10, 2), nullable=False)  # Preço de venda
    cost = Column(DECIMAL(10, 2))  # Custo de produção (admin only)
    discount_percentage = Column(Float, default=0)  # Desconto percentual
    discount_price = Column(DECIMAL(10, 2))  # Preço com desconto aplicado
    
    # Estoque
    stock = Column(Integer, nullable=False, default=0)  # Quantidade em estoque
    low_stock_threshold = Column(Integer, default=10)  # Alerta de estoque baixo
    reserved_stock = Column(Integer, default=0)  # Quantidade reservada (pedidos em processamento)
    available_stock = Column(Integer, default=0)  # stock - reserved_stock
    
    # Dimensões e Peso
    length = Column(Float)  # comprimento (cm)
    width = Column(Float)  # largura (cm)
    height = Column(Float)  # altura (cm)
    weight = Column(Float)  # peso (kg)
    
    # Informações adicionais
    material = Column(String(100))  # ex: "Silk", "Wool", "Cotton"
    color = Column(String(50))  # cor principal
    size = Column(String(50))  # tamanho
    
    # Status
    is_active = Column(Boolean, default=True, index=True)  # Produto disponível para venda
    is_featured = Column(Boolean, default=False)  # Destaque na loja
    is_new = Column(Boolean, default=True)  # Produto novo
    
    # Metadados
    images = Column(JSON)  # Lista de URLs das imagens
    specifications = Column(JSON)  # Especificações técnicas (formato livre)
    attributes = Column(JSON)  # Atributos adicionais (formato livre)
    
    # Auditoria
    created_at = Column(DateTime, server_default=func.now(), index=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), index=True)
    
    def __repr__(self):
        return f"<Product(id={self.id}, name='{self.name}', sku='{self.sku}', price={self.price})>"
