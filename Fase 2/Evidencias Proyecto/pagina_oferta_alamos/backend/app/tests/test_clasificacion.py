"""HU-21: clasificación ABC."""
import pytest

from app.services.abc_service import clasificar_abc



def test_pareto_basico():
    r = clasificar_abc([(1, 800), (2, 100), (3, 50), (4, 30), (5, 20), (6, 0)])
    assert {x.producto_id: x.clase for x in r} == {1: "A", 2: "B", 3: "B", 4: "C", 5: "C", 6: "C"}
    assert r[0].porcentaje == 80.0 and r[1].porcentaje_acumulado == 90.0


def test_el_producto_que_cruza_el_umbral_queda_en_la_clase_superior():
    assert [x.clase for x in clasificar_abc([(1, 60), (2, 40)])] == ["A", "A"]


def test_sin_ventas_todo_es_clase_c():
    assert {x.clase for x in clasificar_abc([(1, 0), (2, 0)])} == {"C"}


def test_lista_vacia():
    assert clasificar_abc([]) == []


def test_empate_se_resuelve_siempre_igual():
    assert [x.producto_id for x in clasificar_abc([(2, 10), (1, 10)])] == [1, 2]


def test_los_porcentajes_suman_100():
    r = clasificar_abc([(i, i * 7) for i in range(1, 30)])
    assert abs(sum(x.porcentaje for x in r) - 100) < 0.5 and r[-1].porcentaje_acumulado == 100.0


@pytest.mark.parametrize("a,b", [(95, 80), (0, 50), (80, 101), (80, 80)])
def test_umbrales_invalidos(a, b):
    with pytest.raises(ValueError):
        clasificar_abc([(1, 1)], a, b)



def test_endpoint_clasifica_con_datos_reales_del_sistema(client, auth, crear_producto, crear_venta):
    pan, leche, te, sal = (crear_producto(n) for n in ("Pan", "Leche", "Té", "Sal"))
    inactivo = crear_producto("Descontinuado", activo=False)
    crear_venta(pan, 8000, cantidad=8)
    crear_venta(leche, 1500)
    crear_venta(te, 300)
    crear_venta(te, 5000, anulada=True)           
    crear_venta(sal, 900, dias_atras=200)        
    crear_venta(inactivo, 99999)                  

    d = client.get("/clasificacion/", headers=auth).json()
    por_nombre = {p["nombre"]: p for p in d["productos"]}
    assert "Descontinuado" not in por_nombre and d["total_productos"] == 4
    assert por_nombre["Pan"]["clase"] == "A" and por_nombre["Pan"]["unidades"] == 8
    assert por_nombre["Té"]["ingresos"] == 300
    assert por_nombre["Sal"]["ingresos"] == 0 and por_nombre["Sal"]["clase"] == "C"
    assert sum(r["productos"] for r in d["resumen"]) == 4

    todo = client.get("/clasificacion/?dias=0", headers=auth).json()
    assert {p["nombre"]: p for p in todo["productos"]}["Sal"]["ingresos"] == 900


def test_endpoint_valida_los_umbrales(client, auth):
    assert client.get("/clasificacion/?umbral_a=90&umbral_b=80", headers=auth).status_code == 400
    assert client.get("/clasificacion/?umbral_a=0", headers=auth).status_code == 422
