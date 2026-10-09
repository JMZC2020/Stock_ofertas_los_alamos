from pydantic import BaseModel


class AlertaOut(BaseModel):
    """Una alerta NO es un registro guardado en la base: se calcula al vuelo
    cada vez que se consulta /alertas/, a partir del estado actual de los
    productos (stock_actual vs stock_minimo, fecha_caducidad vs hoy).
    Por eso desaparece sola cuando el problema se soluciona (se repone
    stock, se actualiza la fecha), sin necesidad de "atenderla" a mano."""
    id: str
    tipo: str  # "stock_critico" | "vencimiento"
    prioridad: str  # "critica" | "alta" | "media"
    producto_id: int
    producto: str
    detalle: str
    fecha: str