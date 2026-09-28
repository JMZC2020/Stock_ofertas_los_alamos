from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app import models  

app = FastAPI(title="Stock Oferta de los Álamos - API")

Base.metadata.create_all(bind=engine)

#productos
from app.routers import productos
app.include_router(productos.router, prefix="/productos", tags=["Productos"])


#proovedores
from app.routers import proveedores
app.include_router(proveedores.router, prefix="/proveedores", tags=["Proveedores"])


#usuario-cambiar de contraseña
from app.routers import usuarios
app.include_router(usuarios.router, prefix="/usuarios", tags=["Usuarios"])



app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    """Endpoint raíz - confirma que la API está corriendo."""
    return {"mensaje": "API de Stock Oferta de los Álamos funcionando"}


@app.get("/health")
def health_check():
    """Endpoint de salud - útil para Docker y monitoreo."""
    return {"status": "ok"}

