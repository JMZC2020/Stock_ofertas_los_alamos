"""Autenticación: dependencia que exige un JWT válido.

Se usa en los routers de datos así:  router = APIRouter(dependencies=[Depends(get_current_user)])
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.usuario import Usuario

_bearer = HTTPBearer(auto_error=False)


def _no_autorizado(detalle: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detalle,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credenciales: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> Usuario:
    """Valida el token del encabezado 'Authorization: Bearer <token>' y devuelve el usuario.

    Responde 401 si falta el token, es inválido o expiró, o si el usuario ya no existe / está deshabilitado.
    """
    if credenciales is None:
        raise _no_autorizado("Debes iniciar sesión")

    try:
        payload = jwt.decode(credenciales.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        usuario_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise _no_autorizado("Sesión inválida o expirada")

    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario or not usuario.activo:
        raise _no_autorizado("Usuario no válido")

    return usuario