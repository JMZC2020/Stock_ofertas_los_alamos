"""Perfil del usuario (nombre y foto del header)."""
import base64


def _jpeg() -> str:
    """Bytes mínimos con la firma de un JPEG (el backend revisa la firma real del archivo)."""
    return "data:image/jpeg;base64," + base64.b64encode(b"\xff\xd8\xff\xe0" + b"\x00" * 64).decode()


def test_ver_mi_perfil(client, auth):
    r = client.get("/usuarios/me", headers=auth).json()
    assert r["nombre"].startswith("Margarita") and r["foto"] is None
    assert "password" not in str(r)


def test_editar_nombre_y_foto_persisten(client, auth):
    foto = _jpeg()
    r = client.put("/usuarios/me", headers=auth, json={"nombre": "  Margarita   León ", "foto": foto})
    assert r.status_code == 200 and r.json()["nombre"] == "Margarita León"
    assert client.get("/usuarios/me", headers=auth).json()["foto"] == foto


def test_quitar_foto(client, auth):
    client.put("/usuarios/me", headers=auth, json={"foto": _jpeg()})
    assert client.put("/usuarios/me", headers=auth, json={"quitar_foto": True}).json()["foto"] is None


def test_nombre_demasiado_corto(client, auth):
    assert client.put("/usuarios/me", headers=auth, json={"nombre": "A"}).status_code == 400


def test_foto_invalida_es_rechazada_y_no_pisa_la_anterior(client, auth):
    foto = _jpeg()
    client.put("/usuarios/me", headers=auth, json={"foto": foto})
    malas = [
        "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
        "data:image/jpeg;base64," + base64.b64encode(b"esto no es una imagen").decode(),
        "javascript:alert(1)",
        "data:image/jpeg;base64," + "A" * 310_000,
    ]
    for mala in malas:
        assert client.put("/usuarios/me", headers=auth, json={"foto": mala}).status_code == 400
    assert client.get("/usuarios/me", headers=auth).json()["foto"] == foto


def test_el_correo_no_se_puede_cambiar(client, auth, usuario):
    r = client.put("/usuarios/me", headers=auth, json={"email": "hack@x.cl"})
    assert r.json()["email"] == usuario.email
