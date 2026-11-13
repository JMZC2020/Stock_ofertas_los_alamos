import base64
import hashlib
import logging
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.correo import correo_configurado, enviar_correo
from app.core.security import hash_password, verify_password, create_access_token
from app.models.usuario import Usuario
from app.schemas.usuario import (
    UsuarioCreate,
    UsuarioOut,
    LoginRequest,
    LoginResponse,
    PasswordResetRequest,
    PasswordResetConfirm,
)

router = APIRouter()
log = logging.getLogger("uvicorn.error")

MENSAJE_RESET = "Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña."


def _hash_token(token: str) -> str:
    """En la base de datos solo se guarda el hash del token: si alguien lee la tabla, no puede usarlo."""
    return hashlib.sha256(token.encode()).hexdigest()


def _enviar_correo_reset(destino: str, nombre: str, enlace: str) -> None:
    if not correo_configurado():
        log.warning("[DEV] SMTP no configurado. Enlace de recuperación para %s: %s", destino, enlace)
        return
    minutos = settings.RESET_TOKEN_MINUTES
    texto = (
        f"Hola {nombre},\n\n"
        f"Recibimos una solicitud para restablecer tu contraseña en Stock Oferta de los Álamos.\n"
        f"Ingresa a este enlace (válido por {minutos} minutos y de un solo uso):\n\n{enlace}\n\n"
        f"Si no fuiste tú, ignora este correo: tu contraseña no cambiará."
    )
    html = (
        f"<p>Hola {nombre},</p>"
        f"<p>Recibimos una solicitud para restablecer tu contraseña en <b>Stock Oferta de los Álamos</b>.</p>"
        f"<p><a href=\"{enlace}\" style=\"background:#1e2d5a;color:#fff;padding:10px 18px;"
        f"border-radius:8px;text-decoration:none\">Restablecer contraseña</a></p>"
        f"<p style=\"color:#666;font-size:13px\">El enlace es válido por {minutos} minutos y de un solo uso. "
        f"Si no fuiste tú, ignora este correo: tu contraseña no cambiará.</p>"
    )
    enviar_correo(destino, "Restablecer tu contraseña - Stock Oferta de los Álamos", texto, html)


@router.post("/", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def crear_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    """Crea la cuenta del administrador. El cliente indicó que solo él
    usará el sistema, así que este sistema está diseñado para UN SOLO
    usuario en total: si ya existe cualquier cuenta, este endpoint se
    bloquea (no solo valida correos duplicados)."""
    ya_existe_alguna_cuenta = db.query(Usuario).first() is not None
    if ya_existe_alguna_cuenta:
        raise HTTPException(
            status_code=400,
            detail="Este sistema ya tiene una cuenta de administrador configurada. "
                   "No se permite crear una segunda cuenta.",
        )

    nuevo = Usuario(
        nombre=usuario.nombre,
        email=usuario.email,
        password_hash=hash_password(usuario.password),
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.post("/login", response_model=LoginResponse)
def login(datos: LoginRequest, db: Session = Depends(get_db)):
    """HU-30: Inicio de sesión con correo y contraseña."""
    usuario = db.query(Usuario).filter(Usuario.email == datos.email).first()

    if not usuario or not verify_password(datos.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

    if not usuario.activo:
        raise HTTPException(status_code=403, detail="Usuario deshabilitado")

    token = create_access_token({"sub": str(usuario.id), "email": usuario.email})
    return LoginResponse(access_token=token)


@router.post("/reset-password/solicitar")
def solicitar_reset(datos: PasswordResetRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """HU-31 (paso 1): verifica la identidad por correo. Genera un token de un solo uso y envía
    un enlace al correo registrado. La respuesta es siempre la misma, exista o no el correo,
    para no revelar qué cuentas existen."""
    usuario = db.query(Usuario).filter(Usuario.email == datos.email).first()

    if usuario and usuario.activo:
        token = secrets.token_urlsafe(32)
        usuario.reset_token = _hash_token(token)
        usuario.reset_token_expira = datetime.utcnow() + timedelta(minutes=settings.RESET_TOKEN_MINUTES)
        db.commit()

        enlace = f"{settings.FRONTEND_ORIGIN.rstrip('/')}/?reset_token={token}"

        
        background_tasks.add_task(_enviar_correo_reset, usuario.email, usuario.nombre, enlace)

    return {"mensaje": MENSAJE_RESET}


@router.post("/reset-password/confirmar")
def confirmar_reset(datos: PasswordResetConfirm, db: Session = Depends(get_db)):
    """HU-31 (paso 2): valida el token recibido por correo y actualiza la contraseña."""
    usuario = db.query(Usuario).filter(Usuario.reset_token == _hash_token(datos.token)).first()

    if not usuario or not usuario.reset_token_expira or usuario.reset_token_expira.replace(tzinfo=None) < datetime.utcnow():
        raise HTTPException(status_code=400, detail="El enlace es inválido o ya expiró. Solicita uno nuevo.")

    usuario.password_hash = hash_password(datos.nueva_password)
    usuario.reset_token = None
    usuario.reset_token_expira = None
    db.commit()

    return {"mensaje": "Contraseña actualizada correctamente"}


FOTO_PREFIJOS = {
    "data:image/jpeg;base64,": (b"\xff\xd8",),
    "data:image/png;base64,": (b"\x89PNG",),
    "data:image/webp;base64,": (b"RIFF",),
}
FOTO_MAX_CARACTERES = 300_000  


class PerfilOut(BaseModel):
    id: int
    nombre: str
    email: str
    foto: str | None = None


class PerfilUpdate(BaseModel):
    nombre: str | None = None
    foto: str | None = None  
    quitar_foto: bool = False


def _perfil(u: Usuario) -> PerfilOut:
    return PerfilOut(id=u.id, nombre=u.nombre, email=u.email, foto=u.foto_perfil)


def _validar_foto(foto: str) -> None:
    """Solo se aceptan imágenes reales jpeg/png/webp (no SVG ni otros formatos), de tamaño acotado."""
    if len(foto) > FOTO_MAX_CARACTERES:
        raise HTTPException(status_code=400, detail="La imagen es demasiado pesada (máx. ~200 KB).")
    for prefijo, firmas in FOTO_PREFIJOS.items():
        if foto.startswith(prefijo):
            try:
                binario = base64.b64decode(foto[len(prefijo):], validate=True)
            except Exception:  # noqa: BLE001
                break
            if binario.startswith(firmas):
                return
            break
    raise HTTPException(status_code=400, detail="La foto debe ser una imagen JPG, PNG o WEBP válida.")


@router.get("/me", response_model=PerfilOut)
def mi_perfil(usuario: Usuario = Depends(get_current_user)):
    """Datos del usuario con sesión iniciada (se muestran en el header)."""
    return _perfil(usuario)


@router.put("/me", response_model=PerfilOut)
def actualizar_mi_perfil(datos: PerfilUpdate, usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    """Cambia el nombre y/o la foto de perfil. El correo no se puede cambiar desde aquí
    porque es el medio de recuperación de contraseña."""
    if datos.nombre is not None:
        nombre = " ".join(datos.nombre.split())
        if not 2 <= len(nombre) <= 100:
            raise HTTPException(status_code=400, detail="El nombre debe tener entre 2 y 100 caracteres.")
        usuario.nombre = nombre

    if datos.quitar_foto:
        usuario.foto_perfil = None
    elif datos.foto is not None:
        _validar_foto(datos.foto)
        usuario.foto_perfil = datos.foto

    db.commit()
    db.refresh(usuario)
    return _perfil(usuario)