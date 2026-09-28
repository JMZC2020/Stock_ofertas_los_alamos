from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False, index=True)
    categoria = Column(String(100), nullable=False, index=True)
    precio_compra = Column(Numeric(10, 2), nullable=False)
    precio_venta = Column(Numeric(10, 2), nullable=False)
    stock_actual = Column(Integer, nullable=False, default=0)
    stock_minimo = Column(Integer, nullable=False, default=10)  # para alertas (HU-16, HU-19)
    dias_alerta_vencimiento = Column(Integer, nullable=False, default=7)  # HU-17, HU-19
    fecha_caducidad = Column(Date, nullable=True)
    ubicacion = Column(String(100), nullable=True)
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"), nullable=True)
    activo = Column(Boolean, default=True, nullable=False)  # eliminación lógica (HU-03)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    proveedor = relationship("Proveedor", back_populates="productos")
    ventas = relationship("Venta", back_populates="producto")
