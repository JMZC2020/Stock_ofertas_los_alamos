from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.proveedor import Proveedor
from app.models.producto import Producto
from app.schemas.proveedor import ProveedorCreate, ProveedorUpdate, ProveedorOut

router = APIRouter()


@router.post("/", response_model=ProveedorOut, status_code=status.HTTP_201_CREATED)
def crear_proveedor(proveedor: ProveedorCreate, db: Session = Depends(get_db)):
    """HU-26: Registrar los datos de contacto de un proveedor."""
    nuevo = Proveedor(**proveedor.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/", response_model=list[ProveedorOut])
def listar_proveedores(
    nombre: Optional[str] = None,
    solo_activos: bool = True,
    db: Session = Depends(get_db),
):
    """Lista proveedores — se usa para el selector de proveedor en Productos (HU-27)."""
    query = db.query(Proveedor)

    if solo_activos:
        query = query.filter(Proveedor.activo == True)  # noqa: E712
    if nombre:
        query = query.filter(Proveedor.nombre.ilike(f"%{nombre}%"))

    return query.order_by(Proveedor.nombre).all()


@router.get("/{proveedor_id}", response_model=ProveedorOut)
def obtener_proveedor(proveedor_id: int, db: Session = Depends(get_db)):
    proveedor = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return proveedor


@router.put("/{proveedor_id}", response_model=ProveedorOut)
def actualizar_proveedor(proveedor_id: int, cambios: ProveedorUpdate, db: Session = Depends(get_db)):
    proveedor = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    datos_nuevos = cambios.model_dump(exclude_unset=True)
    for campo, valor in datos_nuevos.items():
        setattr(proveedor, campo, valor)

    db.commit()
    db.refresh(proveedor)
    return proveedor


@router.delete("/{proveedor_id}", status_code=status.HTTP_200_OK)
def eliminar_proveedor(proveedor_id: int, db: Session = Depends(get_db)):
    """Si el proveedor tiene productos asociados, se desactiva en vez de
    eliminarse (misma lógica que Productos con sus ventas)."""
    proveedor = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    tiene_productos = db.query(Producto).filter(Producto.proveedor_id == proveedor_id).first() is not None

    if tiene_productos:
        proveedor.activo = False
        db.commit()
        return {
            "mensaje": "El proveedor tiene productos asociados, por lo que se desactivó en vez de eliminarse.",
            "eliminado_fisicamente": False,
        }

    db.delete(proveedor)
    db.commit()
    return {"mensaje": "Proveedor eliminado.", "eliminado_fisicamente": True}