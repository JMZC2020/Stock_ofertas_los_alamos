from typing import Optional

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.producto import Producto
from app.models.venta import Venta
from app.schemas.producto import ProductoCreate, ProductoUpdate, ProductoOut, ProductoImportResumen

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


def _num(valor, default=0.0) -> float:
    """Convierte un valor del Excel a número, devolviendo `default` si no se puede."""
    try:
        n = float(valor)
        if n != n:  # NaN
            return default
        return n
    except (TypeError, ValueError):
        return default


@router.post("/importar-excel", response_model=ProductoImportResumen)
def importar_productos_excel(archivo: UploadFile = File(...), db: Session = Depends(get_db)):
    """Carga inicial del catálogo desde el 'INFORME DE PRODUCTOS' exportado por el POS TUU.

    Reglas aplicadas (ver análisis del archivo real del cliente):
    - El encabezado real del Excel de TUU está en la fila 4 (por eso header=3).
    - DESCRIPCION -> nombre, $ COSTO -> precio_compra, $ DETALLE -> precio_venta.
    - CATEGORIA viene vacía en casi todas las filas -> si no viene, se usa "Sin categoría".
    - SALDO (stock) viene negativo en ~72% de las filas (POS del cliente sin cuadrar) ->
      se usa max(SALDO, 0) en vez de confiar ciegamente en el valor negativo.
    - No hay datos de proveedor en este archivo -> proveedor_id queda en None para todos.
    - Hay códigos (CODIGO) duplicados en el archivo -> se importa solo la primera
      aparición de cada código, el resto se reporta como omitido.
    - Si ya existe un producto con el mismo nombre (de una importación anterior),
      se omite para no duplicarlo -> este endpoint se puede correr más de una vez sin riesgo.
    """
    try:
        df = pd.read_excel(archivo.file, header=3, dtype=str)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo leer el Excel: {e}")

    df.columns = [str(c).strip() for c in df.columns]
    for c in df.columns:
        df[c] = df[c].apply(lambda x: x.strip() if isinstance(x, str) else x)

    columnas_requeridas = {"DESCRIPCION", "$ COSTO", "$ DETALLE", "SALDO"}
    faltantes = columnas_requeridas - set(df.columns)
    if faltantes:
        raise HTTPException(
            status_code=400,
            detail=f"El Excel no tiene el formato esperado. Faltan columnas: {', '.join(faltantes)}",
        )

    df = df[df["DESCRIPCION"].notna() & (df["DESCRIPCION"] != "")]

    nombres_existentes = {fila[0].lower() for fila in db.query(Producto.nombre).all()}
    codigos_vistos: set[str] = set()

    errores: list[str] = []
    productos_importados = 0
    productos_omitidos = 0

    for idx, fila in df.iterrows():
        num_fila = idx + 5  # +5: 4 filas de encabezado/título antes de los datos, + 1-index

        try:
            nombre = str(fila["DESCRIPCION"]).strip()
            codigo = str(fila.get("CODIGO") or "").strip()

            if codigo and codigo in codigos_vistos:
                errores.append(f"Fila {num_fila}: código '{codigo}' duplicado en el archivo, se omitió")
                productos_omitidos += 1
                continue

            if nombre.lower() in nombres_existentes:
                productos_omitidos += 1
                continue

            categoria = str(fila.get("CATEGORIA") or "").strip() or "Sin categoría"
            precio_compra = _num(fila.get("$ COSTO"))
            precio_venta = _num(fila.get("$ DETALLE"))
            saldo = _num(fila.get("SALDO"))
            stock_actual = max(int(saldo), 0)

            nuevo = Producto(
                nombre=nombre,
                categoria=categoria,
                precio_compra=precio_compra,
                precio_venta=precio_venta,
                stock_actual=stock_actual,
                proveedor_id=None,
                activo=True,
            )
            db.add(nuevo)

            if codigo:
                codigos_vistos.add(codigo)
            nombres_existentes.add(nombre.lower())
            productos_importados += 1

        except Exception as e:
            errores.append(f"Fila {num_fila}: error inesperado ({e})")
            productos_omitidos += 1

    db.commit()

    return ProductoImportResumen(
        filas_procesadas=len(df),
        productos_importados=productos_importados,
        productos_omitidos=productos_omitidos,
        errores=errores,
    )