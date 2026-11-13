from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.producto import Producto
from app.models.venta import Venta
from app.schemas.clasificacion import (
    ClasificacionOut, ParametrosABC, ProductoABC, ResumenClase,
)
from app.services.abc_service import clasificar_abc

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("/", response_model=ClasificacionOut)
def obtener_clasificacion(
    umbral_a: float = Query(80, gt=0, lt=100, description="% acumulado de ingresos que cubre la clase A"),
    umbral_b: float = Query(95, gt=0, le=100, description="% acumulado de ingresos que cubre hasta la clase B"),
    dias: int = Query(90, ge=0, le=3650, description="Período a analizar en días (0 = todo el historial)"),
    db: Session = Depends(get_db),
):
    """HU-21: Clasificación ABC de los productos activos según sus ingresos por ventas.

    Los umbrales se ajustan con los parámetros de la URL (no se guardan): así cada consulta
    refleja los datos actuales. Las ventas anuladas no cuentan.
    """
    if umbral_a >= umbral_b:
        raise HTTPException(status_code=400, detail="El umbral A debe ser menor que el umbral B")

    consulta = (
        db.query(
            Venta.producto_id,
            func.coalesce(func.sum(Venta.total), 0),
            func.coalesce(func.sum(Venta.cantidad), 0),
        )
        .filter(Venta.anulada == False)  
    )
    if dias > 0:
        consulta = consulta.filter(Venta.fecha >= date.today() - timedelta(days=dias))
    ventas = {pid: (float(total), int(unid)) for pid, total, unid in consulta.group_by(Venta.producto_id).all()}

    productos = db.query(Producto).filter(Producto.activo == True).all()  
    por_id = {p.id: p for p in productos}

    
    entrada = [(p.id, ventas.get(p.id, (0.0, 0))[0]) for p in productos]
    resultados = clasificar_abc(entrada, umbral_a, umbral_b)

    filas: list[ProductoABC] = []
    for pos, r in enumerate(resultados, start=1):
        p = por_id[r.producto_id]
        filas.append(
            ProductoABC(
                posicion=pos,
                producto_id=p.id,
                nombre=p.nombre,
                categoria=p.categoria,
                unidades=ventas.get(p.id, (0.0, 0))[1],
                ingresos=r.ingresos,
                porcentaje=r.porcentaje,
                porcentaje_acumulado=r.porcentaje_acumulado,
                clase=r.clase,
            )
        )

    total_ingresos = sum(f.ingresos for f in filas)
    total_productos = len(filas)
    resumen = []
    for clase in ("A", "B", "C"):
        de_clase = [f for f in filas if f.clase == clase]
        ingresos = sum(f.ingresos for f in de_clase)
        resumen.append(
            ResumenClase(
                clase=clase,
                productos=len(de_clase),
                ingresos=ingresos,
                porcentaje_ingresos=round(ingresos / total_ingresos * 100, 1) if total_ingresos else 0.0,
                porcentaje_productos=round(len(de_clase) / total_productos * 100, 1) if total_productos else 0.0,
            )
        )

    return ClasificacionOut(
        parametros=ParametrosABC(umbral_a=umbral_a, umbral_b=umbral_b, dias=dias),
        total_ingresos=total_ingresos,
        total_productos=total_productos,
        resumen=resumen,
        productos=filas,
    )