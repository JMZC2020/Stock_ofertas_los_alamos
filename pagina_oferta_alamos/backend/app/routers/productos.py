from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.producto import Producto
from app.models.venta import Venta
from app.schemas.producto import ProductoCreate, ProductoUpdate, ProductoOut

router = APIRouter()


@router.post("/", response_model=ProductoOut, status_code=status.HTTP_201_CREATED)
def crear_producto(producto: ProductoCreate, db: Session = Depends(get_db)):
    """HU-01: Registrar un nuevo producto."""
    nuevo = Producto(**producto.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/", response_model=list[ProductoOut])
def listar_productos(
    nombre: Optional[str] = None,
    categoria: Optional[str] = None,
    proveedor_id: Optional[int] = None,
    solo_activos: bool = True,
    db: Session = Depends(get_db),
):
    """HU-04: Buscar y filtrar productos por nombre, categoría o proveedor."""
    query = db.query(Producto)

    if solo_activos:
        query = query.filter(Producto.activo == True)  # noqa: E712
    if nombre:
        query = query.filter(Producto.nombre.ilike(f"%{nombre}%"))
    if categoria:
        query = query.filter(Producto.categoria == categoria)
    if proveedor_id:
        query = query.filter(Producto.proveedor_id == proveedor_id)

    return query.order_by(Producto.nombre).all()


@router.get("/{producto_id}", response_model=ProductoOut)
def obtener_producto(producto_id: int, db: Session = Depends(get_db)):
    """HU-05: Ver el detalle completo de un producto."""
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto


@router.put("/{producto_id}", response_model=ProductoOut)
def actualizar_producto(producto_id: int, cambios: ProductoUpdate, db: Session = Depends(get_db)):
    """HU-02: Editar los datos de un producto existente."""
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    datos_nuevos = cambios.model_dump(exclude_unset=True)  # solo lo que el frontend mandó
    for campo, valor in datos_nuevos.items():
        setattr(producto, campo, valor)

    db.commit()
    db.refresh(producto)
    return producto


@router.delete("/{producto_id}", status_code=status.HTTP_200_OK)
def eliminar_producto(producto_id: int, db: Session = Depends(get_db)):
    """HU-03: Eliminar un producto.
    Si el producto ya tiene ventas registradas, no se borra físicamente
    (se perdería el historial de esas ventas) — se desactiva en su lugar."""
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    tiene_ventas = db.query(Venta).filter(Venta.producto_id == producto_id).first() is not None

    if tiene_ventas:
        producto.activo = False
        db.commit()
        return {
            "mensaje": "El producto tiene ventas asociadas, por lo que se desactivó en vez de eliminarse.",
            "eliminado_fisicamente": False,
        }

    db.delete(producto)
    db.commit()
    return {"mensaje": "Producto eliminado.", "eliminado_fisicamente": True}