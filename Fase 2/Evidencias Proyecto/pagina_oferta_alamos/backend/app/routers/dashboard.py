from collections import defaultdict
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.producto import Producto
from app.models.venta import Venta
from app.schemas.dashboard import (
    DashboardKpis, DashboardOut, MetodoPago, TopProducto, VentaDia,
)

router = APIRouter()

DIAS_VENTANA = 30


@router.get("/", response_model=DashboardOut)
def obtener_dashboard(db: Session = Depends(get_db)):
    """HU-11 / HU-12 / HU-13: KPIs, tendencia diaria y Top 10 de productos.
    Todo se calcula en vivo y excluye ventas anuladas y productos inactivos."""
    hoy = date.today()
    inicio_ventana = hoy - timedelta(days=DIAS_VENTANA - 1)
    inicio_mes = hoy.replace(day=1)
    desde = min(inicio_ventana, inicio_mes)

    # --- Inventario (KPIs de productos) ---
    productos = db.query(Producto).filter(Producto.activo == True).all()  # noqa: E712
    stock_critico = sum(1 for p in productos if p.stock_actual <= p.stock_minimo)
    sin_stock = sum(1 for p in productos if p.stock_actual <= 0)
    por_vencer = vencidos = 0
    for p in productos:
        if p.fecha_caducidad is None:
            continue
        dias = (p.fecha_caducidad - hoy).days
        if dias < 0:
            vencidos += 1
            por_vencer += 1
        elif dias <= p.dias_alerta_vencimiento:
            por_vencer += 1

    # --- Ventas (una sola consulta; se agrega en Python) ---
    ventas = (
        db.query(Venta)
        .options(joinedload(Venta.producto))
        .filter(Venta.anulada == False)  # noqa: E712
        .filter(Venta.fecha >= datetime.combine(desde, datetime.min.time()))
        .all()
    )

    ventas_mes_total = 0.0
    ventas_mes_unidades = 0
    por_dia: dict[date, float] = defaultdict(float)
    por_producto: dict[int, dict] = {}
    por_metodo: dict[str, float] = defaultdict(float)

    for v in ventas:
        # Se usa la fecha tal como quedó guardada: el cierre de caja trae un día completo
        # y convertir de zona horaria podría correrlo al día anterior.
        dia = v.fecha.date()
        total = float(v.total)

        if dia >= inicio_mes:
            ventas_mes_total += total
            ventas_mes_unidades += v.cantidad

        if dia >= inicio_ventana:
            por_dia[dia] += total
            nombre = v.producto.nombre if v.producto else f"Producto #{v.producto_id}"
            acc = por_producto.setdefault(v.producto_id, {"producto": nombre, "unidades": 0, "total": 0.0})
            acc["unidades"] += v.cantidad
            acc["total"] += total
            por_metodo[(v.metodo_pago or "Sin dato").strip() or "Sin dato"] += total

    # Serie diaria completa (rellena con 0 los días sin ventas)
    serie = [
        VentaDia(fecha=(inicio_ventana + timedelta(days=i)).isoformat(),
                 total=round(por_dia.get(inicio_ventana + timedelta(days=i), 0.0), 2))
        for i in range(DIAS_VENTANA)
    ]

    # Variación: últimos 7 días vs los 7 anteriores
    ult7 = sum(s.total for s in serie[-7:])
    ant7 = sum(s.total for s in serie[-14:-7])
    variacion = round((ult7 - ant7) / ant7 * 100, 1) if ant7 > 0 else None

    top = sorted(por_producto.values(), key=lambda x: (-x["unidades"], -x["total"]))[:10]

    total_metodos = sum(por_metodo.values())
    metodos = [
        MetodoPago(metodo=m, total=round(t, 2),
                   porcentaje=round(t / total_metodos * 100, 1) if total_metodos else 0.0)
        for m, t in sorted(por_metodo.items(), key=lambda kv: -kv[1])
    ]

    return DashboardOut(
        kpis=DashboardKpis(
            productos_activos=len(productos),
            stock_critico=stock_critico,
            sin_stock=sin_stock,
            por_vencer=por_vencer,
            vencidos=vencidos,
            ventas_mes_total=round(ventas_mes_total, 2),
            ventas_mes_unidades=ventas_mes_unidades,
        ),
        ventas_diarias=serie,
        variacion_7d=variacion,
        top_productos=[TopProducto(producto=t["producto"], unidades=t["unidades"], total=round(t["total"], 2)) for t in top],
        metodos_pago=metodos,
    )