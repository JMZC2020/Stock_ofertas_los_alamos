import io
from datetime import datetime
from typing import Optional

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.producto import Producto
from app.models.venta import Venta
from app.schemas.venta import VentaCreate, VentaOut, VentaCSVResumen

router = APIRouter()


@router.post("/", response_model=VentaOut, status_code=status.HTTP_201_CREATED)
def crear_venta(venta: VentaCreate, db: Session = Depends(get_db)):
    """HU-06: Registrar una venta manual.

    - El precio se toma del producto en este momento (no lo manda el frontend),
      para que quede una "fotografía" fiel del precio al momento de vender.
    - Si no hay stock suficiente, la venta se BLOQUEA (no se permite dejar
      el stock en negativo, a diferencia de lo que encontramos en el Excel
      del cliente).
    - Si la venta se concreta, se descuenta el stock del producto.
    """
    producto = db.query(Producto).filter(Producto.id == venta.producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    if not producto.activo:
        raise HTTPException(status_code=400, detail="El producto está inactivo, no se puede vender")

    if producto.stock_actual < venta.cantidad:
        raise HTTPException(
            status_code=400,
            detail=f"Stock insuficiente. Stock actual: {producto.stock_actual}, "
                   f"cantidad solicitada: {venta.cantidad}",
        )

    precio_unitario = producto.precio_venta
    total = precio_unitario * venta.cantidad

    nueva_venta = Venta(
        producto_id=venta.producto_id,
        cantidad=venta.cantidad,
        precio_unitario=precio_unitario,
        total=total,
        fecha=venta.fecha,
        metodo_pago=venta.metodo_pago,
        origen="manual",
        anulada=False,
    )

    producto.stock_actual -= venta.cantidad

    db.add(nueva_venta)
    db.commit()
    db.refresh(nueva_venta)
    return nueva_venta


@router.get("/", response_model=list[VentaOut])
def listar_ventas(
    producto_id: Optional[int] = None,
    fecha_desde: Optional[datetime] = None,
    fecha_hasta: Optional[datetime] = None,
    solo_vigentes: bool = True,
    db: Session = Depends(get_db),
):
    """HU-08: Buscar y filtrar ventas por producto o rango de fechas."""
    query = db.query(Venta)

    if solo_vigentes:
        query = query.filter(Venta.anulada == False)  # noqa: E712
    if producto_id:
        query = query.filter(Venta.producto_id == producto_id)
    if fecha_desde:
        query = query.filter(Venta.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(Venta.fecha <= fecha_hasta)

    return query.order_by(Venta.fecha.desc()).all()


@router.get("/{venta_id}", response_model=VentaOut)
def obtener_venta(venta_id: int, db: Session = Depends(get_db)):
    """HU-09: Ver el detalle completo de una venta."""
    venta = db.query(Venta).filter(Venta.id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return venta


@router.put("/{venta_id}/anular", response_model=VentaOut)
def anular_venta(venta_id: int, db: Session = Depends(get_db)):
    """HU-10: Anular una venta.

    Una venta anulada:
    - queda marcada como anulada=True (no se borra, por trazabilidad),
    - restituye automáticamente el stock del producto asociado.

    No permite anular dos veces la misma venta (el stock ya se restituyó).
    """
    venta = db.query(Venta).filter(Venta.id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    if venta.anulada:
        raise HTTPException(status_code=400, detail="Esta venta ya estaba anulada")

    producto = db.query(Producto).filter(Producto.id == venta.producto_id).first()
    if producto:
        producto.stock_actual += venta.cantidad

    venta.anulada = True

    db.commit()
    db.refresh(venta)
    return venta


@router.post("/importar-csv", response_model=VentaCSVResumen)
def importar_ventas_csv(archivo: UploadFile = File(...), db: Session = Depends(get_db)):
    """HU-07: Importar ventas masivamente desde un archivo CSV.

    Columnas esperadas (sin importar mayúsculas/minúsculas ni espacios):
    - fecha           (obligatoria)
    - producto        (obligatoria, debe calzar EXACTO con el nombre del producto)
    - cantidad        (obligatoria)
    - metodo_pago     (opcional, por defecto "Efectivo")

    Cada fila se procesa de forma independiente: si una fila falla
    (producto no existe, stock insuficiente, datos inválidos), se registra
    el error y se sigue con las demás, en vez de abortar todo el archivo.

    Nota: el emparejamiento es por NOMBRE exacto porque el modelo Producto
    todavía no tiene un campo de código de barra. Cuando llegue el archivo
    real del POS (que sí trae código de barra), conviene agregar ese campo
    para un emparejamiento más confiable.
    """
    contenido = archivo.file.read()

    try:
        texto = contenido.decode("utf-8")
    except UnicodeDecodeError:
        texto = contenido.decode("latin-1")

    try:
        df = pd.read_csv(io.StringIO(texto), sep=None, engine="python")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo leer el CSV: {e}")

    df.columns = [str(c).strip().lower() for c in df.columns]

    columnas_requeridas = {"fecha", "producto", "cantidad"}
    faltantes = columnas_requeridas - set(df.columns)
    if faltantes:
        raise HTTPException(
            status_code=400,
            detail=f"Faltan columnas obligatorias en el CSV: {', '.join(faltantes)}",
        )

    errores: list[str] = []
    ventas_importadas = 0

    for idx, fila in df.iterrows():
        num_fila = idx + 2  # +2: fila 1 es el encabezado, y pandas es 0-index

        try:
            nombre_producto = str(fila["producto"]).strip()
            cantidad = int(fila["cantidad"])
            fecha = pd.to_datetime(fila["fecha"])
            metodo_pago = str(fila["metodo_pago"]).strip() if "metodo_pago" in df.columns and pd.notna(fila.get("metodo_pago")) else "Efectivo"

            if cantidad <= 0:
                errores.append(f"Fila {num_fila}: cantidad inválida ({cantidad})")
                continue

            producto = (
                db.query(Producto)
                .filter(Producto.nombre.ilike(nombre_producto), Producto.activo == True)  # noqa: E712
                .first()
            )
            if not producto:
                errores.append(f"Fila {num_fila}: producto '{nombre_producto}' no encontrado o inactivo")
                continue

            if producto.stock_actual < cantidad:
                errores.append(
                    f"Fila {num_fila}: stock insuficiente para '{nombre_producto}' "
                    f"(stock: {producto.stock_actual}, pedido: {cantidad})"
                )
                continue

            precio_unitario = producto.precio_venta
            total = precio_unitario * cantidad

            nueva_venta = Venta(
                producto_id=producto.id,
                cantidad=cantidad,
                precio_unitario=precio_unitario,
                total=total,
                fecha=fecha,
                metodo_pago=metodo_pago,
                origen="csv",
                anulada=False,
            )
            producto.stock_actual -= cantidad

            db.add(nueva_venta)
            ventas_importadas += 1

        except Exception as e:
            errores.append(f"Fila {num_fila}: error inesperado ({e})")

    db.commit()

    return VentaCSVResumen(
        filas_procesadas=len(df),
        ventas_importadas=ventas_importadas,
        errores=errores,
    )