"""HU-30 / CP-007: inicio de sesión y protección de los endpoints con JWT."""
from datetime import timedelta

import pytest

from app.core.security import create_access_token
from app.tests.conftest import EMAIL, PASSWORD


RUTAS_PROTEGIDAS = [
    ("get", "/productos/"), ("post", "/productos/"), ("get", "/proveedores/"), ("post", "/proveedores/"),
    ("get", "/ventas/"), ("post", "/ventas/"), ("delete", "/ventas/"), ("delete", "/ventas/1"), ("put", "/ventas/1/anular"),
    ("post", "/ventas/importar-excel"), ("get", "/alertas/"), ("get", "/dashboard/"), ("get", "/clasificacion/"),
    ("get", "/usuarios/me"), ("put", "/usuarios/me"),
]


@pytest.mark.parametrize("metodo,ruta", RUTAS_PROTEGIDAS)
def test_sin_token_responde_401(client, metodo, ruta):
    assert getattr(client, metodo)(ruta).status_code == 401


def test_login_correcto_devuelve_token_que_sirve(client, usuario):
    r = client.post("/usuarios/login", json={"email": EMAIL, "password": PASSWORD})
    assert r.status_code == 200
    token = r.json()["access_token"]
    assert client.get("/ventas/", headers={"Authorization": f"Bearer {token}"}).status_code == 200


def test_login_con_contrasena_incorrecta(client, usuario):
    r = client.post("/usuarios/login", json={"email": EMAIL, "password": "incorrecta123"})
    assert r.status_code == 401


def test_login_con_correo_inexistente(client, usuario):
    assert client.post("/usuarios/login", json={"email": "otro@x.cl", "password": PASSWORD}).status_code == 401


def test_token_falso_es_rechazado(client, usuario):
    assert client.get("/ventas/", headers={"Authorization": "Bearer texto-basura"}).status_code == 401


def test_token_expirado_es_rechazado(client, usuario):
    token = create_access_token({"sub": str(usuario.id)}, timedelta(minutes=-1))
    assert client.get("/ventas/", headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_token_de_usuario_inexistente_es_rechazado(client, usuario):
    token = create_access_token({"sub": "9999"})
    assert client.get("/ventas/", headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_usuario_deshabilitado_pierde_acceso(client, db, usuario, auth):
    assert client.get("/ventas/", headers=auth).status_code == 200
    usuario.activo = False
    db.commit()
    assert client.get("/ventas/", headers=auth).status_code == 401


def test_solo_se_permite_un_usuario(client, usuario):
    r = client.post("/usuarios/", json={"nombre": "Otro", "email": "otro@x.cl", "password": "otra-clave-123"})
    assert r.status_code == 400


def test_primer_usuario_se_puede_crear(client):
    r = client.post("/usuarios/", json={"nombre": "Admin", "email": "a@x.cl", "password": "clave-larga-123"})
    assert r.status_code == 201
    assert "password" not in r.json() and "password_hash" not in r.json()
