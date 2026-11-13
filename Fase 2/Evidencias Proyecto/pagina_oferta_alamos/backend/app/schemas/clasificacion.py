from pydantic import BaseModel


class ParametrosABC(BaseModel):
    umbral_a: float
    umbral_b: float
    dias: int  


class ResumenClase(BaseModel):
    clase: str
    productos: int
    ingresos: float
    porcentaje_ingresos: float
    porcentaje_productos: float


class ProductoABC(BaseModel):
    posicion: int
    producto_id: int
    nombre: str
    categoria: str
    unidades: int
    ingresos: float
    porcentaje: float
    porcentaje_acumulado: float
    clase: str


class ClasificacionOut(BaseModel):
    parametros: ParametrosABC
    total_ingresos: float
    total_productos: int
    resumen: list[ResumenClase]
    productos: list[ProductoABC]