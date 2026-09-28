# Backend — Stock Oferta de los Álamos

## Estructura

```
app/
├── main.py          # Punto de entrada de FastAPI
├── core/
│   ├── config.py    # Variables de entorno (lee .env)
│   └── database.py  # Conexión a PostgreSQL (SQLAlchemy)
├── models/          # Tablas de la BD (SQLAlchemy) — vacío, se llena por sprint
├── schemas/         # Validación de datos (Pydantic) — vacío, se llena por sprint
├── routers/         # Endpoints de la API — vacío, se llena por sprint
├── services/        # Lógica de negocio — vacío, se llena por sprint
└── tests/           # Pruebas (Sprint 8: Testing y QA)
```

## Cómo probar que funciona (sin haber programado nada aún)

1. Copiar `.env.example` a `.env` y ajustar valores si es necesario.
2. Desde la raíz del proyecto completo (con `docker-compose.yml`):
   ```
   docker-compose up --build
   ```
3. Abrir `http://localhost:8000` → debería responder `{"mensaje": "API de Stock Oferta de los Álamos funcionando"}`
4. Abrir `http://localhost:8000/docs` → documentación interactiva de la API (Swagger), se va llenando sola a medida que agreguen endpoints.

## Próximo paso

Empezar por `app/models/` definiendo las tablas de Productos (Sprint 3), siguiendo el modelo de datos que definan antes de escribir código.
