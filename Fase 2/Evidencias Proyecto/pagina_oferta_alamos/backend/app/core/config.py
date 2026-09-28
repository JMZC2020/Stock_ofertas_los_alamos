from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configuración leída desde variables de entorno (.env)."""

    DATABASE_URL: str = "postgresql://stock_user:stock_pass@db:5432/stock_alamos"
    SECRET_KEY: str = "cambiar-esta-clave-por-una-segura"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


settings = Settings()
