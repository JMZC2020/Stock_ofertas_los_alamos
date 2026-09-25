from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Proveedor(Base):
    __tablename__ = "proveedores"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    rut = Column(String(20), nullable=True)
    contacto = Column(String(150), nullable=True)
    email = Column(String(150), nullable=True)
    telefono = Column(String(30), nullable=True)
    activo = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Un proveedor puede tener muchos productos asociados
    productos = relationship("Producto", back_populates="proveedor")
