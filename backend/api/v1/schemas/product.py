from pydantic import BaseModel, Field, field_validator, field_serializer
from typing import Optional, List, Dict, Any
from decimal import Decimal
from datetime import datetime


class ProductCreateRequest(BaseModel):
    """Schema para criação de produto"""
    sku: str = Field(..., min_length=1, max_length=100, description="SKU único do produto")
    name: str = Field(..., min_length=1, max_length=255, description="Nome do produto")
    description: str = Field(..., min_length=10, description="Descrição completa do produto")
    short_description: Optional[str] = Field(None, max_length=500, description="Descrição curta")
    category: str = Field(..., min_length=1, max_length=100, description="Categoria do produto")
    subcategory: Optional[str] = Field(None, max_length=100, description="Subcategoria")
    tags: Optional[List[str]] = Field(default_factory=list, description="Tags/etiquetas")
    
    price: Decimal = Field(..., gt=0, decimal_places=2, description="Preço de venda")
    cost: Optional[Decimal] = Field(None, ge=0, decimal_places=2, description="Custo do produto")
    discount_percentage: Optional[float] = Field(0, ge=0, le=100, description="Percentual de desconto")
    
    stock: int = Field(..., ge=0, description="Quantidade total em estoque")
    low_stock_threshold: Optional[int] = Field(10, ge=0, description="Limite de estoque baixo")
    
    length: Optional[float] = Field(None, gt=0, description="Comprimento em cm")
    width: Optional[float] = Field(None, gt=0, description="Largura em cm")
    height: Optional[float] = Field(None, gt=0, description="Altura em cm")
    weight: Optional[float] = Field(None, gt=0, description="Peso em kg")
    
    material: Optional[str] = Field(None, max_length=100, description="Material do produto")
    color: Optional[str] = Field(None, max_length=100, description="Cor principal")
    size: Optional[str] = Field(None, max_length=50, description="Tamanho (P, M, G, etc)")
    
    is_active: bool = Field(True, description="Produto ativo para venda")
    is_featured: bool = Field(False, description="Destaque na vitrine")
    is_new: bool = Field(False, description="Produto novo")
    
    images: Optional[List[str]] = Field(default_factory=list, description="URLs das imagens")
    specifications: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Especificações técnicas")
    attributes: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Atributos adicionais")
    
    @field_validator('sku')
    @classmethod
    def sku_uppercase(cls, v: str) -> str:
        return v.upper().strip()
    
    @field_validator('name', 'category')
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip()
    
    @field_validator('discount_percentage')
    @classmethod
    def validate_discount(cls, v: Optional[float]) -> float:
        if v is None:
            return 0.0
        if not 0 <= v <= 100:
            raise ValueError('Desconto deve estar entre 0 e 100')
        return v


class ProductUpdateRequest(BaseModel):
    """Schema para atualização de produto"""
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, min_length=10)
    short_description: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    subcategory: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = None
    
    price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    cost: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    discount_percentage: Optional[float] = Field(None, ge=0, le=100)
    
    stock: Optional[int] = Field(None, ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    
    length: Optional[float] = Field(None, gt=0)
    width: Optional[float] = Field(None, gt=0)
    height: Optional[float] = Field(None, gt=0)
    weight: Optional[float] = Field(None, gt=0)
    
    material: Optional[str] = Field(None, max_length=100)
    color: Optional[str] = Field(None, max_length=100)
    size: Optional[str] = Field(None, max_length=50)
    
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_new: Optional[bool] = None
    
    images: Optional[List[str]] = None
    specifications: Optional[Dict[str, Any]] = None
    attributes: Optional[Dict[str, Any]] = None
    
    @field_validator('sku')
    @classmethod
    def sku_uppercase(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return v.upper().strip()
    
    @field_validator('name', 'category')
    @classmethod
    def strip_whitespace(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return v.strip()


class ProductResponse(BaseModel):
    """Schema de resposta para produto"""
    id: int
    sku: str
    name: str
    description: str
    short_description: Optional[str]
    category: str
    subcategory: Optional[str]
    tags: Optional[List[str]]
    
    price: Decimal
    cost: Optional[Decimal]
    discount_percentage: float
    discount_price: Optional[Decimal]
    
    stock: int
    reserved_stock: int
    available_stock: int
    low_stock_threshold: int
    
    length: Optional[float]
    width: Optional[float]
    height: Optional[float]
    weight: Optional[float]
    
    material: Optional[str]
    color: Optional[str]
    size: Optional[str]
    
    is_active: bool
    is_featured: bool
    is_new: bool
    
    images: Optional[List[str]]
    specifications: Optional[Dict[str, Any]]
    attributes: Optional[Dict[str, Any]]
    
    created_at: datetime
    updated_at: datetime
    
    @field_serializer('price', 'cost', 'discount_price')
    def serialize_decimal_as_float(self, value: Optional[Decimal]) -> Optional[float]:
        """Serializes Decimal fields to float for JSON compatibility"""
        if value is None:
            return None
        return float(value)
    
    class Config:
        from_attributes = True
