from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.producto import ProductoOut


class VentaBase(BaseModel):
    producto_id: int
    cantidad: int = Field(gt=0)  # no tiene sentido una venta de 0 o negativa
    fecha: datetime
    metodo_pago: Optional[str] = None


class VentaCreate(VentaBase):
    """Datos requeridos para registrar una venta manual (HU-06).
    precio_unitario y total NO se piden aquí: el backend los calcula
    tomando el precio_venta actual del producto, para evitar que el
    frontend pueda enviar un precio manipulado."""
    pass


class VentaOut(VentaBase):
    """Lo que la API devuelve al frontend."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    precio_unitario: Decimal
    total: Decimal
    origen: str
    anulada: bool
    created_at: datetime
    producto: Optional[ProductoOut] = None


class VentaCSVResumen(BaseModel):
    """Respuesta al importar un archivo CSV (HU-07)."""
    filas_procesadas: int
    ventas_importadas: int
    errores: list[str] = []
