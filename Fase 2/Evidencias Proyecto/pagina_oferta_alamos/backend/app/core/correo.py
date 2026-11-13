"""Envío de correos por SMTP (solo librería estándar de Python, sin dependencias nuevas)."""
import logging
import smtplib
import ssl
from email.message import EmailMessage

from app.core.config import settings

log = logging.getLogger("uvicorn.error")


def correo_configurado() -> bool:
    return bool(settings.SMTP_HOST)


def enviar_correo(destino: str, asunto: str, texto: str, html: str | None = None) -> bool:
    """Devuelve True si el servidor SMTP aceptó el mensaje. Nunca lanza excepciones:
    un fallo de correo no debe romper la solicitud del usuario."""
    if not correo_configurado():
        return False

    msg = EmailMessage()
    msg["Subject"] = asunto
    msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
    msg["To"] = destino
    msg.set_content(texto)
    if html:
        msg.add_alternative(html, subtype="html")

    try:
        ctx = ssl.create_default_context()
        if settings.SMTP_PORT == 465:
            servidor = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, context=ctx, timeout=15)
        else:
            servidor = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
        with servidor as s:
            if settings.SMTP_PORT != 465 and settings.SMTP_STARTTLS:
                s.starttls(context=ctx)
            if settings.SMTP_USER:
                s.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            s.send_message(msg)
        return True
    except Exception as e:  
        log.error("No se pudo enviar el correo a %s: %s", destino, e)  
        return False