import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, confirmationUrl, baseUrl } = await req.json();

    if (!email || !confirmationUrl) {
      return new Response(
        JSON.stringify({ error: "Email y URL de confirmación son requeridos" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const logoUrl = baseUrl ? `${baseUrl}/logo-email.svg` : 'https://travesia.app/logo-email.svg';

    console.log("Sending confirmation email to:", email);

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirma tu cuenta</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="width: 100%; max-width: 520px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);">
                <!-- Header with logo -->
                <tr>
                  <td align="center" style="padding: 40px 40px 24px 40px; background-color: #2E37DB;">
                    <img src="${logoUrl}" alt="travesIA" style="height: 48px; width: auto;" />
                    <p style="margin: 12px 0 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.85); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">Tu asistente de viajes con IA</p>
                  </td>
                </tr>
                
                <!-- Main content -->
                <tr>
                  <td style="padding: 36px 40px 40px 40px;">
                    <h2 style="margin: 0 0 20px 0; font-size: 26px; font-weight: 600; color: #1a1a1a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                      ¡Bienvenido${firstName ? ` ${firstName}` : ''}!
                    </h2>
                    <p style="margin: 0 0 28px 0; font-size: 16px; line-height: 1.7; color: #444444; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                      Gracias por registrarte en travesIA. Para completar tu registro y comenzar a planificar tus viajes, confirma tu dirección de correo electrónico.
                    </p>
                    
                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td align="center" style="padding: 8px 0 32px 0;">
                          <a href="${confirmationUrl}" 
                             style="display: inline-block; padding: 14px 48px; background-color: #2E37DB; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                            Confirmar mi cuenta
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #666666; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                      Si el botón no funciona, copia y pega este enlace en tu navegador:
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                      <a href="${confirmationUrl}" style="color: #2E37DB; text-decoration: underline; word-break: break-all;">${confirmationUrl}</a>
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
        subject: "Confirma tu cuenta - travesIA",
        html: htmlContent,
      }),
    });

    const data = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Confirmation email sent successfully:", data);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending confirmation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
