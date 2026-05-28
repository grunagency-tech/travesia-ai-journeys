import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedDomains = ['lovableproject.com', 'localhost', 'grunagency.com', 'lovable.app'];

function validateResetInput(body: any): { valid: true; data: { email: string; redirectUrl: string; firstName?: string } } | { valid: false } {
  if (!body.email || typeof body.email !== 'string' || !emailRegex.test(body.email) || body.email.length > 255) return { valid: false };
  if (!body.redirectUrl || typeof body.redirectUrl !== 'string') return { valid: false };
  try {
    new URL(body.redirectUrl);
  } catch { return { valid: false }; }
  if (!allowedDomains.some(d => body.redirectUrl.includes(d))) return { valid: false };
  return { valid: true, data: { email: body.email, redirectUrl: body.redirectUrl, firstName: body.firstName } };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    const parseResult = validateResetInput(body);
    if (!parseResult.valid) {
      return new Response(
        JSON.stringify({ success: true, message: "Si el correo existe, recibirás un enlace de recuperación" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    const { email, redirectUrl, firstName } = parseResult.data;

    console.log("Processing password reset request");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({ email, token, expires_at: expiresAt });

    if (insertError) {
      console.error("Error storing token:", insertError);
      throw new Error("Failed to create reset token");
    }

    const resetLink = `${redirectUrl}?token=${token}`;
    const baseUrl = redirectUrl.replace('/reset-password', '');
    const logoUrl = `${baseUrl}/logo-email.svg`;

    console.log("Sending password reset email to:", email);

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Restablecer contraseña</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="width: 100%; max-width: 520px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);">
                <tr>
                  <td align="center" style="padding: 40px 40px 24px 40px; background-color: #2E37DB;">
                    <img src="${logoUrl}" alt="travesIA" style="height: 48px; width: auto;" />
                    <p style="margin: 12px 0 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.85);">Tu asistente de viajes con IA</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 36px 40px 40px 40px;">
                    <h2 style="margin: 0 0 20px 0; font-size: 26px; font-weight: 600; color: #1a1a1a;">
                      ¡Hola${firstName ? ` ${firstName}` : ''}!
                    </h2>
                    <p style="margin: 0 0 28px 0; font-size: 16px; line-height: 1.7; color: #444444;">
                      Recibimos una solicitud para restablecer la contraseña de tu cuenta en travesIA. Si no realizaste esta solicitud, puedes ignorar este correo.
                    </p>
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td align="center" style="padding: 8px 0 32px 0;">
                          <a href="${resetLink}" style="display: inline-block; padding: 14px 48px; background-color: #2E37DB; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                            Restablecer contraseña
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #666666;">
                      Si el botón no funciona, copia y pega este enlace en tu navegador:
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.6;">
                      <a href="${resetLink}" style="color: #2E37DB; text-decoration: underline; word-break: break-all;">${resetLink}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "travesIA <noreply@travel.grunagency.com>",
        to: [email],
        subject: "Restablece tu contraseña - travesIA",
        html: htmlContent,
      }),
    });

    const data = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending password reset email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
