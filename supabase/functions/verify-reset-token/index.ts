import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateTokenInput(body: any): { valid: true; data: { token: string; newPassword?: string } } | { valid: false; error: string } {
  if (!body.token || typeof body.token !== 'string' || !uuidRegex.test(body.token)) {
    return { valid: false, error: "Token inválido" };
  }
  if (body.newPassword !== undefined) {
    if (typeof body.newPassword !== 'string' || body.newPassword.length < 8 || body.newPassword.length > 72) {
      return { valid: false, error: "La contraseña debe tener entre 8 y 72 caracteres" };
    }
  }
  return { valid: true, data: { token: body.token, newPassword: body.newPassword } };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    const parseResult = validateTokenInput(body);
    if (!parseResult.valid) {
      return new Response(
        JSON.stringify({ error: parseResult.error }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    const { token, newPassword } = parseResult.data;

    console.log("Verifying reset token");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single();

    if (tokenError || !tokenData) {
      console.error("Token not found or already used:", tokenError);
      return new Response(
        JSON.stringify({ error: "Token inválido o ya utilizado" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      console.error("Token expired");
      return new Response(
        JSON.stringify({ error: "El enlace ha expirado. Solicita uno nuevo." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!newPassword) {
      return new Response(
        JSON.stringify({ valid: true, email: tokenData.email }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error listing users:", userError);
      throw new Error("Error al buscar usuario");
    }

    const user = userData.users.find((u: any) => u.email === tokenData.email);
    
    if (!user) {
      console.error("User not found for email:", tokenData.email);
      return new Response(
        JSON.stringify({ error: "Usuario no encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      throw new Error("Error al actualizar contraseña");
    }

    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', tokenData.id);

    console.log("Password updated successfully for:", tokenData.email);

    return new Response(
      JSON.stringify({ success: true, message: "Contraseña actualizada correctamente" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in verify-reset-token:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
