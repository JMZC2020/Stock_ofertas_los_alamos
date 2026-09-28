from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UsuarioBase(BaseModel):
    nombre: str
    email: EmailStr


class UsuarioCreate(UsuarioBase):
    """Para crear el usuario inicial del sistema."""
    password: str = Field(min_length=8)


class UsuarioOut(UsuarioBase):
    """Nunca se devuelve el password_hash al frontend."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    activo: bool
    created_at: datetime


class LoginRequest(BaseModel):
    """HU-30: Inicio de sesión."""
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PasswordResetRequest(BaseModel):
    """HU-31 (paso 1): solicitar recuperación."""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """HU-31 (paso 2): confirmar con el token recibido por correo."""
    token: str
    nueva_password: str = Field(min_length=8)
