"""Algoritmo de clasificación ABC: función pura, sin base de datos (fácil de probar).

Método de Pareto: se ordenan los productos por ingresos (de mayor a menor) y se acumula su
porcentaje sobre el total.
  - Clase A: los productos que, sumados, llegan hasta el umbral A (por defecto 80 % de los ingresos).
  - Clase B: los siguientes, hasta el umbral B (por defecto 95 %).
  - Clase C: el resto, incluidos los productos sin ventas en el período.
El producto que "cruza" el umbral queda en la clase superior (así siempre existe al menos un A).
"""
from dataclasses import dataclass


@dataclass
class ResultadoABC:
    producto_id: int
    ingresos: float
    porcentaje: float
    porcentaje_acumulado: float
    clase: str


def clasificar_abc(
    ingresos_por_producto: list[tuple[int, float]],
    umbral_a: float = 80.0,
    umbral_b: float = 95.0,
) -> list[ResultadoABC]:
    """Recibe [(producto_id, ingresos)] y devuelve la lista ordenada por ingresos descendente."""
    if not 0 < umbral_a < umbral_b <= 100:
        raise ValueError("Los umbrales deben cumplir 0 < A < B <= 100")

    ordenados = sorted(ingresos_por_producto, key=lambda x: (-x[1], x[0]))
    total = sum(max(i, 0.0) for _, i in ordenados)

    resultados: list[ResultadoABC] = []
    acumulado = 0.0
    for producto_id, ingresos in ordenados:
        ingresos = max(ingresos, 0.0)
        porcentaje = (ingresos / total * 100) if total > 0 else 0.0

        if ingresos <= 0:
            clase = "C"
        elif acumulado < umbral_a:
            clase = "A"
        elif acumulado < umbral_b:
            clase = "B"
        else:
            clase = "C"

        acumulado += porcentaje
        resultados.append(
            ResultadoABC(
                producto_id=producto_id,
                ingresos=ingresos,
                porcentaje=round(porcentaje, 2),
                porcentaje_acumulado=round(min(acumulado, 100.0), 2),
                clase=clase,
            )
        )
    return resultados