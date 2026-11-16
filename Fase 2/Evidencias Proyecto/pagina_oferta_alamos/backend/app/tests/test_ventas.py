"""HU-06..HU-10 y SC-04: registrar, anular, eliminar y limpiar ventas; importar el cierre de caja."""
from datetime import datetime

from app.models.producto import Producto
from app.models.venta import Venta
from app.tests.conftest import excel_cierre_de_caja

AHORA = datetime.now().isoformat()


def _stock(db, producto_id):
    db.expire_all()
    return db.query(Producto).get(producto_id).stock_actual


def _vender(client, auth, producto, cantidad):
    return client.post("/ventas/", headers=auth, json={"producto_id": producto.id, "cantidad": cantidad, "fecha": AHORA, "metodo_pago": "Efectivo"})



def test_venta_descuenta_stock_y_toma_el_precio_del_producto(client, auth, db, crear_producto):
    p = crear_producto(stock=10, precio=1500)
    r = _vender(client, auth, p, 3)
    assert r.status_code == 201
    assert float(r.json()["total"]) == 4500
    assert _stock(db, p.id) == 7


def test_venta_con_stock_insuficiente_se_bloquea(client, auth, db, crear_producto):
    p = crear_producto(stock=2)
    assert _vender(client, auth, p, 5).status_code == 400
    assert _stock(db, p.id) == 2


def test_no_se_vende_un_producto_inactivo(client, auth, crear_producto):
    p = crear_producto(activo=False)
    assert _vender(client, auth, p, 1).status_code == 400


def test_cantidad_cero_es_invalida(client, auth, crear_producto):
    assert _vender(client, auth, crear_producto(), 0).status_code == 422



def test_anular_restituye_stock_y_no_se_puede_anular_dos_veces(client, auth, db, crear_producto):
    p = crear_producto(stock=10)
    venta_id = _vender(client, auth, p, 4).json()["id"]
    assert client.put(f"/ventas/{venta_id}/anular", headers=auth).status_code == 200
    assert _stock(db, p.id) == 10
    assert client.put(f"/ventas/{venta_id}/anular", headers=auth).status_code == 400
    assert _stock(db, p.id) == 10


def test_listado_oculta_anuladas_salvo_que_se_pidan(client, auth, crear_producto, crear_venta):
    p = crear_producto()
    crear_venta(p, 1000)
    crear_venta(p, 500, anulada=True)
    assert len(client.get("/ventas/", headers=auth).json()) == 1
    assert len(client.get("/ventas/?solo_vigentes=false", headers=auth).json()) == 2



def test_eliminar_venta_vigente_restituye_stock(client, auth, db, crear_producto):
    p = crear_producto(stock=10)
    venta_id = _vender(client, auth, p, 3).json()["id"]
    assert client.delete(f"/ventas/{venta_id}", headers=auth).status_code == 200
    assert _stock(db, p.id) == 10
    assert db.query(Venta).count() == 0


def test_eliminar_venta_anulada_no_toca_el_stock(client, auth, db, crear_producto):
    p = crear_producto(stock=10)
    venta_id = _vender(client, auth, p, 3).json()["id"]
    client.put(f"/ventas/{venta_id}/anular", headers=auth)
    client.delete(f"/ventas/{venta_id}", headers=auth)
    assert _stock(db, p.id) == 10


def test_eliminar_venta_inexistente(client, auth):
    assert client.delete("/ventas/9999", headers=auth).status_code == 404


def test_limpiar_borra_todo_y_deja_el_stock_como_antes(client, auth, db, crear_producto):
    a, b = crear_producto("A", stock=10), crear_producto("B", stock=20)
    _vender(client, auth, a, 2)
    _vender(client, auth, b, 5)
    anulada = _vender(client, auth, a, 1).json()["id"]
    client.put(f"/ventas/{anulada}/anular", headers=auth)
    r = client.delete("/ventas/", headers=auth).json()
    assert r["eliminadas"] == 3
    assert db.query(Venta).count() == 0
    assert (_stock(db, a.id), _stock(db, b.id)) == (10, 20)


def test_limpiar_sin_ventas_no_falla(client, auth):
    assert client.delete("/ventas/", headers=auth).json()["eliminadas"] == 0



def _subir(client, auth, contenido, nombre="cierre.xlsx"):
    return client.post("/ventas/importar-excel", headers=auth, files={"archivo": (nombre, contenido, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")})


FILAS = [
    ("1001", "Leche entera 1L", "7801", 1000, 2, 2000, "EFECTIVO"),
    ("1002", "Pan marraqueta", "7802", 200, 5, 1000, "T. CREDITO"),
]


def test_importar_crea_ventas_con_fecha_folio_y_metodo_de_pago(client, auth, db, crear_producto):
    leche = crear_producto("Leche entera 1L", stock=10, codigo="7801")
    crear_producto("Pan marraqueta", stock=20, codigo="7802")
    r = _subir(client, auth, excel_cierre_de_caja(FILAS))
    assert r.status_code == 200, r.text
    resumen = r.json()
    assert (resumen["filas_procesadas"], resumen["ventas_importadas"], resumen["ventas_duplicadas"]) == (2, 2, 0)
    ventas = db.query(Venta).order_by(Venta.folio).all()
    assert [v.folio for v in ventas] == ["1001", "1002"]
    assert ventas[0].fecha.date().isoformat() == "2026-10-06"       
    assert ventas[1].metodo_pago == "T. CREDITO" and ventas[0].origen == "excel"
    assert _stock(db, leche.id) == 8


def test_importar_dos_veces_el_mismo_archivo_no_duplica(client, auth, db, crear_producto):
    leche = crear_producto("Leche entera 1L", stock=10, codigo="7801")
    crear_producto("Pan marraqueta", stock=20, codigo="7802")
    contenido = excel_cierre_de_caja(FILAS)
    _subir(client, auth, contenido)
    segundo = _subir(client, auth, contenido).json()
    assert segundo["ventas_importadas"] == 0 and segundo["ventas_duplicadas"] == 2
    assert db.query(Venta).count() == 2
    assert _stock(db, leche.id) == 8                               


def test_importar_despues_de_limpiar_vuelve_a_cargar(client, auth, db, crear_producto):
    crear_producto("Leche entera 1L", stock=10, codigo="7801")
    crear_producto("Pan marraqueta", stock=20, codigo="7802")
    contenido = excel_cierre_de_caja(FILAS)
    _subir(client, auth, contenido)
    client.delete("/ventas/", headers=auth)
    assert _subir(client, auth, contenido).json()["ventas_importadas"] == 2


def test_importar_busca_por_nombre_si_el_codigo_no_calza(client, auth, db, crear_producto):
    crear_producto("Leche entera 1L", stock=10, codigo="OTRO")
    r = _subir(client, auth, excel_cierre_de_caja([FILAS[0]])).json()
    assert r["ventas_importadas"] == 1


def test_importar_informa_productos_no_encontrados(client, auth, db):
    r = _subir(client, auth, excel_cierre_de_caja([FILAS[0]])).json()
    assert r["ventas_importadas"] == 0 and any("no encontrado" in e for e in r["errores"])


def test_importar_avisa_si_el_stock_queda_negativo(client, auth, db, crear_producto):
    p = crear_producto("Leche entera 1L", stock=1, codigo="7801")
    r = _subir(client, auth, excel_cierre_de_caja([FILAS[0]])).json()
    assert r["ventas_importadas"] == 1 and any("negativo" in e for e in r["errores"])
    assert _stock(db, p.id) == -1


def test_archivo_que_no_es_un_cierre_de_caja_se_rechaza(client, auth):
    from openpyxl import Workbook
    import io
    wb = Workbook(); wb.active.append(["a", "b"]); buf = io.BytesIO(); wb.save(buf)
    assert _subir(client, auth, buf.getvalue()).status_code == 400
    assert _subir(client, auth, b"esto no es un excel").status_code == 400
