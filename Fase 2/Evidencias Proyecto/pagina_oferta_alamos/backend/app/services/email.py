import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger("app.email")


def _generar_html_recuperacion(nombre: str, link_recuperacion: str) -> str:
    """Genera la plantilla de correo HTML con la identidad visual corporativa."""
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer Contraseña - Oferta de los Álamos</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f4fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0d1530;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f4fc; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Contenedor Principal -->
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; border: 1px solid #dde2ef; overflow: hidden; box-shadow: 0 4px 12px rgba(13, 21, 48, 0.05);" cellspacing="0" cellpadding="0">
          
          <!-- Encabezado / Branding -->
          <tr>
            <td style="background-color: #0d1530; padding: 28px 32px; text-align: left;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">Oferta de los Álamos</h1>
              <p style="margin: 4px 0 0; font-size: 12px; color: #a8bde8;">Sistema de Gestión de Inventario y Ventas</p>
            </td>
          </tr>

          <!-- Cuerpo del Correo -->
          <tr>
            <td style="padding: 32px 32px 24px;">
              <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 700; color: #0d1530;">Recuperación de contraseña</h2>
              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #4a5580;">
                Hola <strong>{nombre or 'Administrador'}</strong>,
              </p>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #4a5580;">
                Hemos recibido una solicitud para restablecer la contraseña de acceso a tu cuenta. Para definir una nueva clave, haz clic en el siguiente botón:
              </p>

              <!-- Botón CTA -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="border-radius: 12px; background-color: #1e2d5a;">
                    <a href="{link_recuperacion}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 12px; background-color: #1e2d5a; letter-spacing: 0.2px;">
                      Restablecer mi contraseña
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Aviso de Expiración -->
              <div style="background-color: #fdf3e3; border: 1px solid #fae1be; border-radius: 10px; padding: 12px 16px; margin: 24px 0;">
                <p style="margin: 0; font-size: 12px; color: #b95d0a; line-height: 1.5;">
                  ⏱ <strong>Importante:</strong> Este enlace expirará en <strong>1 hora</strong> por motivos de seguridad.
                </p>
              </div>

              <!-- Enlace de respaldo -->
              <p style="margin: 20px 0 0; font-size: 12px; color: #8891b0; line-height: 1.5;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                <a href="{link_recuperacion}" style="color: #3554a5; word-break: break-all;">{link_recuperacion}</a>
              </p>
            </td>
          </tr>

          <!-- Pie de página -->
          <tr>
            <td style="padding: 20px 32px 28px; background-color: #f9fbfd; border-top: 1px solid #eef1f8; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 11px; color: #8891b0;">
                Si no solicitaste este cambio, puedes ignorar este correo de forma segura. Tu contraseña no cambiará.
              </p>
              <p style="margin: 0; font-size: 11px; color: #a8bde8;">
                © 2024 Oferta de los Álamos · Todos los derechos reservados
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def _generar_texto_plano(nombre: str, link_recuperacion: str) -> str:
    """Genera la versión en texto plano para clientes de correo sin soporte HTML."""
    return f"""Oferta de los Álamos - Recuperación de contraseña

Hola {nombre or 'Administrador'},

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.
Para ingresar tu nueva contraseña, abre el siguiente enlace en tu navegador:

{link_recuperacion}

Este enlace expirará en 1 hora por razones de seguridad.

Si no solicitaste este cambio, puedes ignorar este mensaje; tu contraseña seguirá siendo la misma.

---
Oferta de los Álamos · Sistema de Gestión
"""


def enviar_correo_recuperacion(email_destinatario: str, nombre_destinatario: str, token: str) -> bool:
    """Envía el correo con el enlace de recuperación vía SMTP (HU-31)."""
    link_recuperacion = f"{settings.FRONTEND_ORIGIN}/?reset_token={token}"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Restablece tu contraseña - Oferta de los Álamos"
    msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
    msg["To"] = email_destinatario

    # Adjuntar versiones texto y HTML
    texto = _generar_texto_plano(nombre_destinatario, link_recuperacion)
    html = _generar_html_recuperacion(nombre_destinatario, link_recuperacion)

    msg.attach(MIMEText(texto, "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))

    try:
        # Conexión al servidor SMTP configurado (Docker Mailpit o Gmail / SMTP externo)
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)

        if settings.SMTP_TLS:
            server.starttls()

        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)

        server.sendmail(settings.EMAILS_FROM_EMAIL, [email_destinatario], msg.as_string())
        server.quit()

        logger.info(f"Correo de recuperación enviado exitosamente a {email_destinatario}")
        return True

    except Exception as exc:
        logger.warning(
            f"No se pudo enviar el correo vía SMTP a {email_destinatario}: {exc}. "
            f"Enlace generado para desarrollo: {link_recuperacion}"
        )
        return False
