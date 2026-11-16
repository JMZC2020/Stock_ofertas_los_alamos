"""HU-16 / HU-17: alertas de stock y vencimiento."""
from datetime import date, timedelta


def _alertas(client, auth):
    return {a["producto"]: a for a in client.get("/alertas/", headers=auth).json()}


def test_stock_agotado_bajo_y_normal(client, auth, crear_producto):
    crear_producto("Agotado", stock=0, minimo=5)
    crear_producto("Bajo", stock=3, minimo=5)
    crear_producto("Normal", stock=50, minimo=5)
    a = _alertas(client, auth)
    assert a["Agotado"]["prioridad"] == "critica" and a["Bajo"]["prioridad"] == "alta"
    assert "Normal" not in a


def test_vencimientos(client, auth, crear_producto):
    hoy = date.today()
    crear_producto("Vencido", caducidad=hoy - timedelta(days=3))
    crear_producto("Vence pronto", caducidad=hoy + timedelta(days=1))
    crear_producto("Vence en la semana", caducidad=hoy + timedelta(days=6))
    crear_producto("Lejano", caducidad=hoy + timedelta(days=90))
    a = _alertas(client, auth)
    assert a["Vencido"]["prioridad"] == "critica"
    assert a["Vence pronto"]["prioridad"] == "alta" and a["Vence en la semana"]["prioridad"] == "media"
    assert "Lejano" not in a


def test_la_alerta_desaparece_al_reponer_stock(client, auth, db, crear_producto):
    p = crear_producto("Leche", stock=0, minimo=5)
    assert "Leche" in _alertas(client, auth)
    p.stock_actual = 40
    db.commit()
    assert "Leche" not in _alertas(client, auth)


def test_productos_inactivos_no_generan_alertas(client, auth, crear_producto):
    crear_producto("Viejo", stock=0, activo=False)
    assert client.get("/alertas/", headers=auth).json() == []
