from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr


class ProveedorBase(BaseModel):
    nombre: str
    rut: Optional[str] = None
    contacto: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None


class ProveedorCreate(ProveedorBase):
    """Datos requeridos para crear un proveedor (HU-26)."""
    pass


class ProveedorUpdate(BaseModel):
    """Todos los campos opcionales: solo se envían los que cambian."""
    nombre: Optional[str] = None
    rut: Optional[str] = None
    contacto: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    activo: Optional[bool] = None


class ProveedorOut(ProveedorBase):
    """Lo que la API devuelve al frontend."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    activo: bool
    created_at: datetime
