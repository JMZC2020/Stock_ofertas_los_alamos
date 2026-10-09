from datetime import date, datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.producto import Producto
from app.schemas.alerta import AlertaOut

router = APIRouter()


def _alertas_stock(productos: list[Producto]) -> list[AlertaOut]:
    """HU-16: Alertar cuando el stock de un producto está bajo o en cero."""
    alertas = []
    for p in productos:
        if p.stock_actual <= 0:
            alertas.append(AlertaOut(
                id=f"stock-{p.id}",
                tipo="stock_critico",
                prioridad="critica",
                producto_id=p.id,
                producto=p.nombre,
                detalle=f"Sin stock disponible (actual: {p.stock_actual})",
                fecha=date.today().isoformat(),
            ))
        elif p.stock_actual <= p.stock_minimo:
            alertas.append(AlertaOut(
                id=f"stock-{p.id}",
                tipo="stock_critico",
                prioridad="alta",
                producto_id=p.id,
                producto=p.nombre,
                detalle=f"Stock bajo: {p.stock_actual} unidades (mínimo: {p.stock_minimo})",
                fecha=date.today().isoformat(),
            ))
    return alertas


def _alertas_vencimiento(productos: list[Producto]) -> list[AlertaOut]:
    """HU-17: Alertar cuando un producto está por vencer o ya venció."""
    hoy = date.today()
    alertas = []
    for p in productos:
        if not p.fecha_caducidad:
            continue

        dias_restantes = (p.fecha_caducidad - hoy).days

        if dias_restantes < 0:
            alertas.append(AlertaOut(
                id=f"venc-{p.id}",
                tipo="vencimiento",
                prioridad="critica",
                producto_id=p.id,
                producto=p.nombre,
                detalle=f"Venció hace {abs(dias_restantes)} día(s)",
                fecha=p.fecha_caducidad.isoformat(),
            ))
        elif dias_restantes <= p.dias_alerta_vencimiento:
            prioridad = "alta" if dias_restantes <= 2 else "media"
            detalle = "Vence hoy" if dias_restantes == 0 else f"Vence en {dias_restantes} día(s)"
            alertas.append(AlertaOut(
                id=f"venc-{p.id}",
                tipo="vencimiento",
                prioridad=prioridad,
                producto_id=p.id,
                producto=p.nombre,
                detalle=detalle,
                fecha=p.fecha_caducidad.isoformat(),
            ))
    return alertas


@router.get("/", response_model=list[AlertaOut])
def listar_alertas(db: Session = Depends(get_db)):
    """HU-16 / HU-17: Centro de alertas — stock bajo/agotado y productos por vencer.
    Solo considera productos activos. Se calcula en vivo en cada consulta."""
    productos = db.query(Producto).filter(Producto.activo == True).all()  # noqa: E712

    alertas = _alertas_stock(productos) + _alertas_vencimiento(productos)

    orden_prioridad = {"critica": 0, "alta": 1, "media": 2}
    alertas.sort(key=lambda a: orden_prioridad.get(a.prioridad, 99))

    return alertas