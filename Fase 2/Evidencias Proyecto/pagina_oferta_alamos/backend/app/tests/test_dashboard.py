"""HU-11 / HU-12 / HU-13: dashboard."""


def test_dashboard_vacio_no_falla(client, auth):
    r = client.get("/dashboard/", headers=auth)
    assert r.status_code == 200
    d = r.json()
    assert d["kpis"]["productos_activos"] == 0 and d["top_productos"] == []


def test_dashboard_calcula_kpis_y_excluye_anuladas(client, auth, crear_producto, crear_venta):
    pan = crear_producto("Pan", stock=0)
    leche = crear_producto("Leche", stock=50)
    crear_producto("Viejo", activo=False)
    crear_venta(pan, 1000, cantidad=2, dias_atras=0)
    crear_venta(leche, 500, dias_atras=0, anulada=True)
    d = client.get("/dashboard/", headers=auth).json()
    assert d["kpis"]["productos_activos"] == 2
    assert d["kpis"]["sin_stock"] == 1
    assert [t["producto"] if "producto" in t else t.get("nombre") for t in d["top_productos"]] == ["Pan"]
    assert len(d["ventas_diarias"]) == 30
