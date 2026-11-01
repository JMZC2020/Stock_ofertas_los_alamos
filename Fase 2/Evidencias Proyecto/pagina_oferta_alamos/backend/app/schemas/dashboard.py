from typing import Optional

from pydantic import BaseModel


class DashboardKpis(BaseModel):
    productos_activos: int
    stock_critico: int          
    sin_stock: int              
    por_vencer: int            
    vencidos: int              
    ventas_mes_total: float     
    ventas_mes_unidades: int


class VentaDia(BaseModel):
    fecha: str                 
    total: float


class TopProducto(BaseModel):
    producto: str
    unidades: int
    total: float


class MetodoPago(BaseModel):
    metodo: str
    total: float
    porcentaje: float


class DashboardOut(BaseModel):
    """Resumen agregado del sistema (HU-11, HU-12, HU-13). Se calcula en vivo."""
    kpis: DashboardKpis
    ventas_diarias: list[VentaDia]          
    variacion_7d: Optional[float] = None    
    top_productos: list[TopProducto]        
    metodos_pago: list[MetodoPago]         