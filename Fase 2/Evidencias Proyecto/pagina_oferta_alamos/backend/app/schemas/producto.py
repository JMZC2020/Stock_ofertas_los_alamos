from datetime import datetime, date
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.proveedor import ProveedorOut


class ProductoBase(BaseModel):
    """Campos comunes. OJO: stock_actual NO tiene ge=0 aquí a propósito —
    esta clase es la base de ProductoOut (lo que la API devuelve al leer),
    y un producto puede legítimamente quedar con stock negativo en la
    práctica (historial de ventas importado, problemas de inventario del
    cliente). La regla de "no negativo al crear/editar a mano" vive en
    ProductoCreate y ProductoUpdate, no acá."""
    nombre: str
    codigo_barra: Optional[str] = None
    categoria: str
    precio_compra: Decimal = Field(ge=0)
    precio_venta: Decimal = Field(ge=0)
    stock_actual: int = 0
    stock_minimo: int = Field(ge=0, default=10)
    dias_alerta_vencimiento: int = Field(ge=0, default=7)
    fecha_caducidad: Optional[date] = None
    ubicacion: Optional[str] = None
    proveedor_id: Optional[int] = None


class ProductoCreate(ProductoBase):
    """Datos requeridos para registrar un producto (HU-01).
    Acá sí se exige stock_actual >= 0: un producto nuevo creado a mano
    no debería partir con stock negativo."""
    stock_actual: int = Field(ge=0, default=0)


class ProductoUpdate(BaseModel):
    """Todos los campos opcionales: se usa en la edición (HU-02)."""
    nombre: Optional[str] = None
    codigo_barra: Optional[str] = None
    categoria: Optional[str] = None
    precio_compra: Optional[Decimal] = Field(default=None, ge=0)
    precio_venta: Optional[Decimal] = Field(default=None, ge=0)
    stock_actual: Optional[int] = Field(default=None, ge=0)
    stock_minimo: Optional[int] = Field(default=None, ge=0)
    dias_alerta_vencimiento: Optional[int] = Field(default=None, ge=0)
    fecha_caducidad: Optional[date] = None
    ubicacion: Optional[str] = None
    proveedor_id: Optional[int] = None
    activo: Optional[bool] = None


class ProductoOut(ProductoBase):
    """Lo que la API devuelve al frontend (incluye datos del proveedor, si tiene)."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    activo: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    proveedor: Optional[ProveedorOut] = None


class ProductoImportResumen(BaseModel):
    """Respuesta al importar productos desde el Excel del POS (TUU)."""
    filas_procesadas: int
    productos_importados: int
    productos_omitidos: int
    errores: list[str] = []