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


def _buscar_fecha_cierre(vista: pd.DataFrame) -> Optional[str]:
    """El 'cierre de caja' trae UNA fecha para todo el archivo (es el cierre de
    un día), escrita en una celda tipo 'FECHA' seguida del valor al lado,
    no una columna de fecha por fila. Busca esa celda en las primeras filas."""
    for i in range(min(10, len(vista))):
        fila = vista.iloc[i].tolist()
        for j, celda in enumerate(fila):
            if isinstance(celda, str) and celda.strip().upper() == "FECHA":
                for k in range(j + 1, len(fila)):
                    if pd.notna(fila[k]) and str(fila[k]).strip():
                        return str(fila[k]).strip()
    return None


def _detectar_fila_encabezado(vista: pd.DataFrame, columnas_esperadas: set[str]) -> Optional[int]:
    """Busca la fila que trae el encabezado de la tabla de detalle de ventas
    (en el 'cierre de caja' real del cliente aparece recién en la fila ~144,
    después de varios bloques de resumen)."""
    for i in range(len(vista)):
        valores = {str(v).strip().upper() for v in vista.iloc[i].tolist() if pd.notna(v)}
        if len(valores & columnas_esperadas) >= 3:
            return i
    return None


@router.post("/importar-excel", response_model=VentaCSVResumen)
def importar_ventas_excel(archivo: UploadFile = File(...), db: Session = Depends(get_db)):
    """HU-07: Importar ventas desde el 'Cierre de Caja' exportado por el POS TUU.

    Este archivo es un reporte de UN SOLO DÍA (no trae fecha por fila), con
    varios bloques de resumen antes de la tabla de detalle real, que aparece
    bajo 'DETALLE DE DOCUMENTOS' con columnas: NRO., DESCRIPCION, CODIGO,
    VAL.UN., CANT, DCTO, TOTAL, F.PAGO (x3, veremos por qué), UTILIDAD, EXENTO.

    Reglas aplicadas (ver análisis del archivo real del cliente):
    - La fecha se lee UNA vez desde la celda 'FECHA' del encabezado del
      reporte y se usa para todas las filas de ese archivo.
    - La fila donde empieza la tabla de detalle se detecta automáticamente
      (no es la fila 1, y puede variar de un cierre a otro según cuántas
      boletas tuvo el día).
    - Hay 3 columnas llamadas "F.PAGO" (Excel las numera F.PAGO, F.PAGO.1,
      F.PAGO.2): cada fila trae el método de pago en SOLO UNA de las tres
      (ej. "EFECTIVO" o "T. CREDITO"), las otras dos vienen vacías. Se
      combinan en un solo valor.
    - Cada producto se busca primero por CODIGO (código de barra, igual al
      que trae el archivo de Productos) y si no calza, por nombre exacto
      como respaldo. En este archivo real, el código matchea ~92% de las
      líneas, bastante mejor que por nombre (~82%).
    - A diferencia de una venta manual (que bloquea si no hay stock), esto
      es un historial de ventas que YA ocurrieron: no se bloquea por falta
      de stock (se deja que quede negativo si corresponde) pero se avisa
      en el resumen cuántas líneas quedaron así, porque refleja el mismo
      problema de inventario que ya detectamos en el archivo de productos.
    - VAL.UN. y TOTAL se usan tal cual vienen en el archivo (son el precio
      real al que se vendió ese día), no se recalculan con el precio actual
      del catálogo.
    """
    contenido = archivo.file.read()

    try:
        vista = pd.read_excel(io.BytesIO(contenido), header=None, dtype=str)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo leer el Excel: {e}")

    fecha_str = _buscar_fecha_cierre(vista)
    if not fecha_str:
        raise HTTPException(
            status_code=400,
            detail="No se encontró la celda 'FECHA' en el encabezado del cierre de caja.",
        )
    try:
        fecha_cierre = pd.to_datetime(fecha_str, dayfirst=True)
    except Exception:
        raise HTTPException(status_code=400, detail=f"No se pudo interpretar la fecha '{fecha_str}'")

    columnas_esperadas = {"NRO.", "DESCRIPCION", "CODIGO", "VAL.UN.", "CANT", "TOTAL", "F.PAGO"}
    fila_encabezado = _detectar_fila_encabezado(vista, columnas_esperadas)
    if fila_encabezado is None:
        raise HTTPException(
            status_code=400,
            detail="No se encontró la tabla de detalle de ventas (se esperaban columnas "
                   "como NRO., DESCRIPCION, CODIGO, VAL.UN., CANT, TOTAL, F.PAGO).",
        )

    df = pd.read_excel(io.BytesIO(contenido), header=fila_encabezado, dtype=str)
    df.columns = [str(c).strip() for c in df.columns]
    for c in df.columns:
        df[c] = df[c].apply(lambda x: x.strip() if isinstance(x, str) else x)

    columnas_requeridas = {"DESCRIPCION", "CODIGO", "CANT", "VAL.UN.", "TOTAL"}
    faltantes = columnas_requeridas - set(df.columns)
    if faltantes:
        raise HTTPException(
            status_code=400,
            detail=f"Faltan columnas obligatorias en la tabla de detalle: {', '.join(faltantes)}",
        )

    df = df[df["DESCRIPCION"].notna() & (df["DESCRIPCION"] != "")]

    columnas_fpago = [c for c in df.columns if c == "F.PAGO" or c.startswith("F.PAGO.")]

    errores: list[str] = []
    ventas_importadas = 0
    ventas_con_stock_negativo = 0

    for idx, fila in df.iterrows():
        num_fila = idx + fila_encabezado + 2

        try:
            codigo = str(fila.get("CODIGO") or "").strip()
            nombre = str(fila["DESCRIPCION"]).strip()
            cantidad = int(float(fila["CANT"]))
            val_unitario = float(str(fila["VAL.UN."]).replace(",", "."))
            total = float(str(fila["TOTAL"]).replace(",", "."))

            metodo_pago = "Efectivo"
            for col in columnas_fpago:
                valor = fila.get(col)
                if pd.notna(valor) and str(valor).strip():
                    metodo_pago = str(valor).strip()
                    break

            if cantidad <= 0:
                errores.append(f"Fila {num_fila}: cantidad inválida ({cantidad})")
                continue

            producto = None
            if codigo:
                producto = db.query(Producto).filter(Producto.codigo_barra == codigo).first()
            if not producto:
                producto = db.query(Producto).filter(Producto.nombre.ilike(nombre)).first()

            if not producto:
                errores.append(f"Fila {num_fila}: producto '{nombre}' (código '{codigo}') no encontrado en el catálogo")
                continue

            nueva_venta = Venta(
                producto_id=producto.id,
                cantidad=cantidad,
                precio_unitario=val_unitario,
                total=total,
                fecha=fecha_cierre,
                metodo_pago=metodo_pago,
                origen="excel",
                anulada=False,
            )
            producto.stock_actual -= cantidad
            if producto.stock_actual < 0:
                ventas_con_stock_negativo += 1

            db.add(nueva_venta)
            ventas_importadas += 1

        except Exception as e:
            errores.append(f"Fila {num_fila}: error inesperado ({e})")

    db.commit()

    if ventas_con_stock_negativo:
        errores.append(
            f"Aviso: {ventas_con_stock_negativo} línea(s) dejaron el stock del producto en negativo "
            f"(reflejan el mismo problema de inventario detectado en el catálogo del cliente)."
        )

    return VentaCSVResumen(
        filas_procesadas=len(df),
        ventas_importadas=ventas_importadas,
        errores=errores,
    )