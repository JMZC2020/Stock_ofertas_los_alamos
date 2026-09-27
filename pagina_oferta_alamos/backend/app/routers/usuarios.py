import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
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
def solicitar_reset(datos: PasswordResetRequest, db: Session = Depends(get_db)):
    """HU-31 (paso 1): genera un token de recuperación de contraseña."""
    usuario = db.query(Usuario).filter(Usuario.email == datos.email).first()

    if not usuario:
        return {"mensaje": "Si el correo existe, se enviará un enlace de recuperación."}

    token = secrets.token_urlsafe(32)
    usuario.reset_token = token
    usuario.reset_token_expira = datetime.utcnow() + timedelta(hours=1)
    db.commit()

    # ⚠️ PENDIENTE: enviar este token por correo real (requiere configurar
    # un servicio SMTP). Mientras tanto, se devuelve aquí mismo SOLO para
    # poder probar el flujo completo durante el desarrollo.
    return {
        "mensaje": "Si el correo existe, se enviará un enlace de recuperación.",
        "token_desarrollo": token,
    }


@router.post("/reset-password/confirmar")
def confirmar_reset(datos: PasswordResetConfirm, db: Session = Depends(get_db)):
    """HU-31 (paso 2): valida el token recibido y actualiza la contraseña."""
    usuario = db.query(Usuario).filter(Usuario.reset_token == datos.token).first()

    if not usuario or not usuario.reset_token_expira or usuario.reset_token_expira < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token inválido o expirado")

    usuario.password_hash = hash_password(datos.nueva_password)
    usuario.reset_token = None
    usuario.reset_token_expira = None
    db.commit()

    return {"mensaje": "Contraseña actualizada correctamente"}