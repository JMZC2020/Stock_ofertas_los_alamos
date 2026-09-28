from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Venta(Base):
    __tablename__ = "ventas"

    id = Column(Integer, primary_key=True, index=True)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Numeric(10, 2), nullable=False)  # "fotografía" del precio al momento de vender
    total = Column(Numeric(10, 2), nullable=False)
    fecha = Column(DateTime(timezone=True), nullable=False, index=True)
    metodo_pago = Column(String(30), nullable=True)
    origen = Column(String(10), nullable=False, default="manual")  # "manual" o "csv" (HU-06 / HU-07)
    anulada = Column(Boolean, default=False, nullable=False)  # HU-10
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    producto = relationship("Producto", back_populates="ventas")
