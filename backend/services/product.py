from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from models.product import Product
from decimal import Decimal
from typing import Optional, List


class ProductService:
    """Serviço de gerenciamento de produtos"""
    
    @staticmethod
    def create_product(db: Session, product_data: dict) -> Product:
        """
        Cria um novo produto no banco de dados
        
        Args:
            db: Sessão do banco de dados
            product_data: Dicionário com dados do produto
            
        Returns:
            Objeto Product criado
            
        Raises:
            ValueError: Se SKU duplicado ou dados inválidos
        """
        try:
            # Calcular preço com desconto se aplicável
            discount_price = ProductService.calculate_discount_price(
                product_data.get('price'),
                product_data.get('discount_percentage', 0)
            )
            
            product = Product(
                **{
                    **product_data,
                    'discount_price': discount_price,
                    'reserved_stock': 0,
                    'available_stock': product_data.get('stock', 0)
                }
            )
            
            db.add(product)
            db.commit()
            db.refresh(product)
            return product
            
        except IntegrityError:
            db.rollback()
            raise ValueError(f"SKU '{product_data.get('sku')}' já existe no sistema")
        except Exception as e:
            db.rollback()
            raise ValueError(f"Erro ao criar produto: {str(e)}")
    
    @staticmethod
    def get_product(db: Session, product_id: int) -> Optional[Product]:
        """
        Obtém um produto pelo ID
        
        Args:
            db: Sessão do banco de dados
            product_id: ID do produto
            
        Returns:
            Objeto Product ou None se não encontrado
        """
        return db.query(Product).filter(Product.id == product_id).first()
    
    @staticmethod
    def get_product_by_sku(db: Session, sku: str) -> Optional[Product]:
        """
        Obtém um produto pelo SKU
        
        Args:
            db: Sessão do banco de dados
            sku: SKU do produto
            
        Returns:
            Objeto Product ou None se não encontrado
        """
        return db.query(Product).filter(Product.sku == sku.upper()).first()
    
    @staticmethod
    def list_products(
        db: Session,
        skip: int = 0,
        limit: int = 50,
        active_only: bool = True,
        category: Optional[str] = None
    ) -> tuple[List[Product], int]:
        """
        Lista produtos com paginação e filtros
        
        Args:
            db: Sessão do banco de dados
            skip: Quantidade de registros a pular
            limit: Limite de registros por página
            active_only: Mostrar apenas produtos ativos
            category: Filtrar por categoria (opcional)
            
        Returns:
            Tupla com lista de produtos e total de registros
        """
        query = db.query(Product)
        
        if active_only:
            query = query.filter(Product.is_active == True)
        
        if category:
            query = query.filter(Product.category.ilike(f"%{category}%"))
        
        total = query.count()
        products = query.offset(skip).limit(limit).all()
        
        return products, total
    
    @staticmethod
    def update_product(
        db: Session,
        product_id: int,
        update_data: dict
    ) -> Optional[Product]:
        """
        Atualiza um produto existente
        
        Args:
            db: Sessão do banco de dados
            product_id: ID do produto
            update_data: Dicionário com dados a atualizar
            
        Returns:
            Objeto Product atualizado ou None se não encontrado
            
        Raises:
            ValueError: Se houver erro de integridade (SKU duplicado)
        """
        product = ProductService.get_product(db, product_id)
        if not product:
            return None
        
        try:
            # Recalcular preço com desconto se necessário
            if 'price' in update_data or 'discount_percentage' in update_data:
                price = update_data.get('price', product.price)
                discount_pct = update_data.get('discount_percentage', product.discount_percentage)
                update_data['discount_price'] = ProductService.calculate_discount_price(price, discount_pct)
            
            # Atualizar available_stock se stock foi modificado
            if 'stock' in update_data:
                new_stock = update_data['stock']
                update_data['available_stock'] = new_stock - product.reserved_stock
            
            for key, value in update_data.items():
                if value is not None and hasattr(product, key):
                    setattr(product, key, value)
            
            db.commit()
            db.refresh(product)
            return product
            
        except IntegrityError:
            db.rollback()
            if 'sku' in update_data:
                raise ValueError(f"SKU '{update_data['sku']}' já existe no sistema")
            raise ValueError("Erro de integridade ao atualizar produto")
        except Exception as e:
            db.rollback()
            raise ValueError(f"Erro ao atualizar produto: {str(e)}")
    
    @staticmethod
    def delete_product(db: Session, product_id: int) -> bool:
        """
        Deleta um produto
        
        Args:
            db: Sessão do banco de dados
            product_id: ID do produto
            
        Returns:
            True se deletado, False se não encontrado
        """
        product = ProductService.get_product(db, product_id)
        if not product:
            return False
        
        try:
            db.delete(product)
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            raise ValueError(f"Erro ao deletar produto: {str(e)}")
    
    @staticmethod
    def calculate_discount_price(
        price: Decimal,
        discount_percentage: float = 0
    ) -> Optional[Decimal]:
        """
        Calcula o preço com desconto
        
        Args:
            price: Preço original
            discount_percentage: Percentual de desconto (0-100)
            
        Returns:
            Preço com desconto ou None se sem desconto
        """
        if not price or discount_percentage <= 0:
            return None
        
        discount_amount = Decimal(str(price)) * Decimal(str(discount_percentage / 100))
        discount_price = Decimal(str(price)) - discount_amount
        return discount_price.quantize(Decimal('0.01'))
    
    @staticmethod
    def update_stock(
        db: Session,
        product_id: int,
        quantity: int,
        operation: str = 'add'
    ) -> Optional[Product]:
        """
        Atualiza o estoque de um produto
        
        Args:
            db: Sessão do banco de dados
            product_id: ID do produto
            quantity: Quantidade a adicionar/remover
            operation: 'add' ou 'remove'
            
        Returns:
            Objeto Product atualizado ou None se não encontrado
            
        Raises:
            ValueError: Se quantidade inválida ou estoque insuficiente
        """
        product = ProductService.get_product(db, product_id)
        if not product:
            return None
        
        if quantity < 0:
            raise ValueError("Quantidade deve ser positiva")
        
        if operation == 'add':
            product.stock += quantity
            product.available_stock += quantity
        elif operation == 'remove':
            if product.available_stock < quantity:
                raise ValueError("Quantidade disponível insuficiente")
            product.stock -= quantity
            product.available_stock -= quantity
        elif operation == 'set':
            product.stock = quantity
            product.available_stock = max(0, quantity - product.reserved_stock)
        else:
            raise ValueError("Operação deve ser 'add', 'remove' ou 'set'")
        
        db.commit()
        db.refresh(product)
        return product
    
    @staticmethod
    def check_low_stock(db: Session) -> List[Product]:
        """
        Retorna produtos com estoque baixo
        
        Returns:
            Lista de produtos com estoque abaixo do limite
        """
        return db.query(Product).filter(
            Product.available_stock <= Product.low_stock_threshold,
            Product.is_active == True
        ).all()
    
    @staticmethod
    def search_products(
        db: Session,
        query: str,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[Product], int]:
        """
        Busca produtos por nome, descrição ou tags
        
        Args:
            db: Sessão do banco de dados
            query: Termo de busca
            skip: Quantidade de registros a pular
            limit: Limite de registros por página
            
        Returns:
            Tupla com lista de produtos encontrados e total
        """
        search_term = f"%{query}%"
        
        query_obj = db.query(Product).filter(
            (Product.name.ilike(search_term)) |
            (Product.description.ilike(search_term)) |
            (Product.sku.ilike(search_term)),
            Product.is_active == True
        )
        
        total = query_obj.count()
        products = query_obj.offset(skip).limit(limit).all()
        
        return products, total
