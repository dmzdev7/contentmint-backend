import { Resend } from 'resend'
import { config } from '@/infrastructure/config/index.js'
import { logError } from './logger.utils.js'

// Inicializar resend
const resend = new Resend(config.resend.apiKey)

/**
 * Envía email de verificación al usuario
 * @param to - Email del destinatario
 * @param token - Token de verificación
 * @param name - Nombre del usuario
 */
export const sendVerificationEmail = async (
  to: string,
  token: string,
  name: string,
) => {
  const verificationUrl = `${config.frontendUrl}/verify-email/${token}`

  try {
    const { data, error } = await resend.emails.send({
      from: config.email.from,
      to,
      subject: `Verifica tu email - ${config.appName}`,
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verifica tu email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center;">
                      <h1 style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: 600;">
                        ¡Bienvenido a ${config.appName}!
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 0 40px 20px 40px;">
                      <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                        Hola <strong>${name}</strong>,
                      </p>
                      <p style="margin: 0 0 24px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                        Gracias por registrarte. Para completar tu registro y verificar tu dirección de email, haz clic en el botón de abajo:
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Button -->
                  <tr>
                    <td style="padding: 0 40px 30px 40px;" align="center">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="border-radius: 6px; background-color: #007bff;">
                            <a href="${verificationUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                              Verificar Email
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Alternative Link -->
                  <tr>
                    <td style="padding: 0 40px 20px 40px;">
                      <p style="margin: 0 0 8px 0; color: #718096; font-size: 14px; line-height: 1.6;">
                        O copia y pega este enlace en tu navegador:
                      </p>
                      <p style="margin: 0; color: #007bff; font-size: 14px; word-break: break-all;">
                        ${verificationUrl}
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Expiration Notice -->
                  <tr>
                    <td style="padding: 20px 40px; background-color: #fff8e1; border-radius: 0 0 8px 8px;">
                      <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                        ⏰ Este enlace expirará en <strong>24 horas</strong>.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                      <p style="margin: 0 0 8px 0; color: #a0aec0; font-size: 13px;">
                        Si no creaste esta cuenta, puedes ignorar este email.
                      </p>
                      <p style="margin: 0; color: #a0aec0; font-size: 13px;">
                        © ${new Date().getFullYear()} ${config.appName}. Todos los derechos reservados.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    })

    if (error) {
      // LOG: Error de Resend
      logError('Resend API error when sending verification email', {
        error,
        context: 'sendVerificationEmail',
        to,
        resendError: error,
      })

      throw new Error('ERROR_SENDING_EMAIL')
    }

    console.log('✅ Email de verificación enviado:', data?.id)
    return data
  } catch (error) {
    // LOG: Error general
    logError('Failed to send verification email', {
      error,
      context: 'sendVerificationEmail',
      to,
    })

    throw new Error('ERROR_SENDING_EMAIL')
  }
}

/**
 * Envía email de bienvenida después de verificar
 * @param to - Email del destinatario
 * @param name - Nombre del usuario
 */
export const sendWelcomeEmail = async (to: string, name: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: config.email.from,
      to,
      subject: `Bienvenido a ${config.appName}`,
      html: `
            <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>¡Bienvenido!</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                  <!-- Header with emoji -->
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center;">
                      <div style="font-size: 64px; margin-bottom: 16px;">🎉</div>
                      <h1 style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: 600;">
                        ¡Email verificado!
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 0 40px 30px 40px;">
                      <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                        ¡Hola <strong>${name}</strong>!
                      </p>
                      <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                        Tu dirección de email ha sido verificada exitosamente. Ya puedes disfrutar de todas las funcionalidades de ${config.appName}.
                      </p>
                      <p style="margin: 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                        ¡Gracias por unirte a nuestra comunidad!
                      </p>
                    </td>
                  </tr>
                  
                  <!-- CTA Button -->
                  <tr>
                    <td style="padding: 0 40px 40px 40px;" align="center">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="border-radius: 6px; background-color: #10b981;">
                            <a href="${config.frontendUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                              Ir a la aplicación
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                      <p style="margin: 0; color: #a0aec0; font-size: 13px;">
                        © ${new Date().getFullYear()} ${config.appName}. Todos los derechos reservados.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
            `,
    })

    if (error) {
      // LOG: Error de Resend
      logError('Resend API error when sending welcome email', {
        error,
        context: 'sendWelcomeEmail',
        to,
        resendError: error,
      })

      throw new Error('ERROR_SENDING_EMAIL')
    }

    console.log('✅ Email de bienvenida enviado:', data?.id)
    return data
  } catch (error) {
    // LOG: Error general
    logError('Failed to send welcome email', {
      error,
      context: 'sendWelcomeEmail',
      to,
    })

    throw new Error('ERROR_SENDING_EMAIL')
  }
}

/**
 * Envía email para resetear contraseña
 * @param to - Email del destinatario
 * @param token - Token de reset
 * @param name - Nombre del usuario
 */
export const sendPasswordResetEmail = async (
  to: string,
  token: string,
  name: string,
) => {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`
  try {
    const { data, error } = await resend.emails.send({
      from: config.email.from,
      to,
      subject: `Resetea tu contraseña - ${config.appName}`,
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Resetea tu contraseña</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center;">
                      <div style="font-size: 64px; margin-bottom: 16px;">🔐</div>
                      <h1 style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: 600;">
                        Resetea tu contraseña
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 0 40px 20px 40px;">
                      <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                        Hola <strong>${name}</strong>,
                      </p>
                      <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                        Recibimos una solicitud para resetear la contraseña de tu cuenta en ${config.appName}.
                      </p>
                      <p style="margin: 0 0 24px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                        Haz clic en el botón de abajo para crear una nueva contraseña:
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Button -->
                  <tr>
                    <td style="padding: 0 40px 30px 40px;" align="center">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="border-radius: 6px; background-color: #dc2626;">
                            <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                              Resetear Contraseña
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Alternative Link -->
                  <tr>
                    <td style="padding: 0 40px 20px 40px;">
                      <p style="margin: 0 0 8px 0; color: #718096; font-size: 14px; line-height: 1.6;">
                        O copia y pega este enlace en tu navegador:
                      </p>
                      <p style="margin: 0; color: #dc2626; font-size: 14px; word-break: break-all;">
                        ${resetUrl}
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Expiration Notice -->
                  <tr>
                    <td style="padding: 20px 40px; background-color: #fef2f2; border-left: 4px solid #dc2626;">
                      <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                        ⏰ Este enlace expirará en <strong>1 hora</strong> por razones de seguridad.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Security Notice -->
                  <tr>
                    <td style="padding: 20px 40px; background-color: #fef3c7;">
                      <p style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; line-height: 1.6; font-weight: 600;">
                        🔒 Nota de seguridad
                      </p>
                      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                        Si no solicitaste este cambio de contraseña, puedes ignorar este email. Tu contraseña no será cambiada.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                      <p style="margin: 0; color: #a0aec0; font-size: 13px;">
                        © ${new Date().getFullYear()} ${config.appName}. Todos los derechos reservados.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    })

    if (error) {
      // LOG: Error de Resend
      logError('Resend API error when sending password reset email', {
        error,
        context: 'sendPasswordResetEmail',
        to,
        resendError: error,
      })

      throw new Error('ERROR_SENDING_EMAIL')
    }

    console.log('✅ Email de reset de contraseña enviado:', data?.id)
    return data
  } catch (error) {
    // LOG: Error general
    logError('Failed to send password reset email', {
      error,
      context: 'sendPasswordResetEmail',
      to,
    })

    throw new Error('ERROR_SENDING_EMAIL')
  }
}

/**
 * Envía email de confirmación después de cambiar contraseña
 * @param to - Email del destinatario
 * @param name - Nombre del usuario
 */
export const sendPasswordChangedEmail = async (to: string, name: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: config.email.from,
      to,
      subject: `Contraseña cambiada - ${config.appName}`,
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contraseña cambiada</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center;">
                      <div style="font-size: 64px; margin-bottom: 16px;">✅</div>
                      <h1 style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: 600;">
                        Contraseña actualizada
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 0 40px 30px 40px;">
                      <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                        Hola <strong>${name}</strong>,
                      </p>
                      <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                        Tu contraseña ha sido cambiada exitosamente.
                      </p>
                      <p style="margin: 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                        Si realizaste este cambio, no necesitas hacer nada más.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Security Alert -->
                  <tr>
                    <td style="padding: 20px 40px; background-color: #fef2f2; border-left: 4px solid #dc2626;">
                      <p style="margin: 0 0 8px 0; color: #991b1b; font-size: 14px; line-height: 1.6; font-weight: 600;">
                        ⚠️ ¿No fuiste tú?
                      </p>
                      <p style="margin: 0 0 16px 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                        Si NO realizaste este cambio, tu cuenta puede estar comprometida. Por favor, contacta a nuestro equipo de soporte inmediatamente.
                      </p>
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="border-radius: 6px; background-color: #dc2626;">
                            <a href="${config.frontendUrl}/support" target="_blank" style="display: inline-block; padding: 10px 20px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 6px;">
                              Contactar Soporte
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Info -->
                  <tr>
                    <td style="padding: 20px 40px;">
                      <p style="margin: 0; color: #718096; font-size: 13px; line-height: 1.6;">
                        <strong>Fecha:</strong> ${new Date().toLocaleString(
                          'es',
                          {
                            dateStyle: 'full',
                            timeStyle: 'short',
                          },
                        )}
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                      <p style="margin: 0; color: #a0aec0; font-size: 13px;">
                        © ${new Date().getFullYear()} ${config.appName}. Todos los derechos reservados.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    })
    if (error) {
      // LOG: Error de Resend
      logError('Resend API error when sending password changed email', {
        error,
        context: 'sendPasswordChangedEmail',
        to,
        resendError: error,
      })

      throw new Error('ERROR_SENDING_EMAIL')
    }

    console.log('✅ Email de cambio de contraseña enviado:', data?.id)
    return data
  } catch (error) {
    // LOG: Error general
    logError('Failed to send password changed email', {
      error,
      context: 'sendPasswordChangedEmail',
      to,
    })

    throw new Error('ERROR_SENDING_EMAIL')
  }
}
