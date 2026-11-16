"""HU-31: recuperación de contraseña por correo."""
import re
from datetime import datetime, timedelta

from app.core.security import verify_password
from app.tests.conftest import EMAIL, PASSWORD


def _token_del_correo(correos) -> str:
    return re.search(r"reset_token=([\w-]+)", correos[-1]["texto"]).group(1)


def test_solicitar_envia_correo_con_enlace_y_no_expone_el_token(client, usuario, correos):
    r = client.post("/usuarios/reset-password/solicitar", json={"email": EMAIL})
    assert r.status_code == 200
    assert len(correos) == 1 and correos[0]["destino"] == EMAIL
    assert "reset_token=" in correos[0]["texto"]
    assert _token_del_correo(correos) not in r.text      


def test_respuesta_identica_si_el_correo_no_existe(client, usuario, correos):
    existente = client.post("/usuarios/reset-password/solicitar", json={"email": EMAIL}).json()
    inexistente = client.post("/usuarios/reset-password/solicitar", json={"email": "nadie@x.cl"}).json()
    assert existente == inexistente
    assert len(correos) == 1                              


def test_en_la_base_solo_se_guarda_el_hash_del_token(client, db, usuario, correos):
    client.post("/usuarios/reset-password/solicitar", json={"email": EMAIL})
    token = _token_del_correo(correos)
    db.refresh(usuario)
    assert usuario.reset_token != token and len(usuario.reset_token) == 64


def test_confirmar_cambia_la_contrasena_y_permite_iniciar_sesion(client, db, usuario, correos):
    client.post("/usuarios/reset-password/solicitar", json={"email": EMAIL})
    r = client.post("/usuarios/reset-password/confirmar", json={"token": _token_del_correo(correos), "nueva_password": "nueva-clave-456"})
    assert r.status_code == 200
    db.refresh(usuario)
    assert verify_password("nueva-clave-456", usuario.password_hash)
    assert client.post("/usuarios/login", json={"email": EMAIL, "password": "nueva-clave-456"}).status_code == 200
    assert client.post("/usuarios/login", json={"email": EMAIL, "password": PASSWORD}).status_code == 401


def test_el_enlace_sirve_una_sola_vez(client, usuario, correos):
    client.post("/usuarios/reset-password/solicitar", json={"email": EMAIL})
    token = _token_del_correo(correos)
    assert client.post("/usuarios/reset-password/confirmar", json={"token": token, "nueva_password": "nueva-clave-456"}).status_code == 200
    assert client.post("/usuarios/reset-password/confirmar", json={"token": token, "nueva_password": "otra-clave-789"}).status_code == 400


def test_token_falso_es_rechazado(client, usuario):
    r = client.post("/usuarios/reset-password/confirmar", json={"token": "falso", "nueva_password": "nueva-clave-456"})
    assert r.status_code == 400


def test_token_expirado_es_rechazado(client, db, usuario, correos):
    client.post("/usuarios/reset-password/solicitar", json={"email": EMAIL})
    db.refresh(usuario)
    usuario.reset_token_expira = datetime.utcnow() - timedelta(minutes=1)
    db.commit()
    r = client.post("/usuarios/reset-password/confirmar", json={"token": _token_del_correo(correos), "nueva_password": "nueva-clave-456"})
    assert r.status_code == 400


def test_contrasena_nueva_muy_corta_es_rechazada(client, usuario, correos):
    client.post("/usuarios/reset-password/solicitar", json={"email": EMAIL})
    r = client.post("/usuarios/reset-password/confirmar", json={"token": _token_del_correo(correos), "nueva_password": "corta"})
    assert r.status_code == 422


def test_si_el_correo_falla_la_solicitud_no_se_cae(client, usuario, monkeypatch):
    from app.routers import usuarios
    monkeypatch.setattr(usuarios, "correo_configurado", lambda: True)
    monkeypatch.setattr(usuarios, "enviar_correo", lambda *a, **k: False)
    assert client.post("/usuarios/reset-password/solicitar", json={"email": EMAIL}).status_code == 200
