from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configuración leída desde variables de entorno (.env)."""

    DATABASE_URL: str = "postgresql://stock_user:stock_pass@db:5432/stock_alamos"
    SECRET_KEY: str = "cambiar-esta-clave-por-una-segura"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    # Configuración de Correo (SMTP para HU-31 y HU-16)
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_TLS: bool = False
    EMAILS_FROM_NAME: str = "Oferta de los Álamos"
    EMAILS_FROM_EMAIL: str = "soporte@ofertadelosalamos.cl"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
