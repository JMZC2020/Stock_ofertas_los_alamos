"""Configuración común de las pruebas.

Las pruebas usan una base SQLite en memoria (rápida y aislada): NO tocan tu base PostgreSQL real.
Cada prueba parte con las tablas vacías.
"""
import io
from datetime import date, datetime, timedelta

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import create_access_token, hash_password
from app.models.producto import Producto
from app.models.usuario import Usuario
from app.models.venta import Venta
from app.routers import alertas, clasificacion, dashboard, productos, proveedores, usuarios, ventas

PASSWORD = "clave-segura-123"
EMAIL = "admin@prueba.cl"


ROUTERS = [
    ("/usuarios", usuarios.router),
    ("/productos", productos.router),
    ("/proveedores", proveedores.router),
    ("/ventas", ventas.router),
    ("/alertas", alertas.router),
    ("/dashboard", dashboard.router),
    ("/clasificacion", clasificacion.router),
]


@pytest.fixture()
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    sesion = sessionmaker(bind=engine, autoflush=False)()
    yield sesion
    sesion.close()
    engine.dispose()


@pytest.fixture()
def client(db):
    app = FastAPI()
    for prefijo, router in ROUTERS:
        app.include_router(router, prefix=prefijo)
    app.dependency_overrides[get_db] = lambda: db
    return TestClient(app)


@pytest.fixture()
def usuario(db):
    u = Usuario(nombre="Margarita Graciela Leon Mallea", email=EMAIL, password_hash=hash_password(PASSWORD), activo=True)
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture()
def auth(usuario):
    """Encabezado con un token válido."""
    return {"Authorization": "Bearer " + create_access_token({"sub": str(usuario.id), "email": usuario.email})}


@pytest.fixture()
def crear_producto(db):
    def _crear(nombre="Producto", stock=10, precio=1000, codigo=None, minimo=5, activo=True, caducidad=None, categoria="Abarrotes"):
        p = Producto(
            nombre=nombre, codigo_barra=codigo, categoria=categoria, precio_compra=precio * 0.7, precio_venta=precio,
            stock_actual=stock, stock_minimo=minimo, dias_alerta_vencimiento=7, fecha_caducidad=caducidad, activo=activo,
        )
        db.add(p)
        db.commit()
        db.refresh(p)
        return p
    return _crear


@pytest.fixture()
def crear_venta(db):
    def _crear(producto, total, cantidad=1, dias_atras=1, anulada=False, folio=None):
        v = Venta(
            producto_id=producto.id, cantidad=cantidad, precio_unitario=total / cantidad, total=total,
            fecha=datetime.now() - timedelta(days=dias_atras), metodo_pago="Efectivo", origen="manual",
            folio=folio, anulada=anulada,
        )
        db.add(v)
        db.commit()
        db.refresh(v)
        return v
    return _crear


@pytest.fixture()
def correos(monkeypatch):
    """Intercepta el envío de correos: devuelve la lista de mensajes 'enviados'."""
    enviados = []
    monkeypatch.setattr(usuarios, "correo_configurado", lambda: True)
    monkeypatch.setattr(usuarios, "enviar_correo", lambda destino, asunto, texto, html=None: enviados.append(
        {"destino": destino, "asunto": asunto, "texto": texto}) or True)
    return enviados


def excel_cierre_de_caja(filas, fecha="06/10/2026") -> bytes:
    """Arma un Excel con el formato del 'Cierre de Caja' del POS TUU:
    bloques de resumen arriba, la celda FECHA y la tabla de detalle más abajo.
    `filas` = [(folio, descripcion, codigo, val_un, cantidad, total, forma_pago)]"""
    from openpyxl import Workbook
    wb = Workbook()
    ws = wb.active
    ws.append(["CIERRE DE CAJA"])
    ws.append(["", "FECHA", fecha])
    ws.append(["RESUMEN", "TOTAL VENTAS", 12345])
    ws.append([])
    ws.append(["DETALLE DE DOCUMENTOS"])
    ws.append(["NRO.", "DESCRIPCION", "CODIGO", "VAL.UN.", "CANT", "DCTO", "TOTAL", "F.PAGO", "F.PAGO", "F.PAGO", "UTILIDAD", "EXENTO"])
    for folio, desc, codigo, val, cant, total, pago in filas:
        ws.append([folio, desc, codigo, val, cant, 0, total, pago, None, None, 0, 0])
    buffer = io.BytesIO()
    wb.save(buffer)
    return buffer.getvalue()
