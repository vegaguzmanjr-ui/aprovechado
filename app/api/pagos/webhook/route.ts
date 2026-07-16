import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Retorno de Azul (ApprovedUrl / DeclinedUrl).
 * Usa la service role key porque Azul llega sin sesión del usuario.
 * TODO producción: validar el AuthHash de la respuesta según el kit de Azul.
 */
export async function GET(req: NextRequest) {
  const resultado = req.nextUrl.searchParams.get("resultado");
  const ordenId = req.nextUrl.searchParams.get("OrderNumber");
  if (!ordenId) return NextResponse.redirect(new URL("/", req.url));

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: pago } = await admin.from("pagos").select("*").eq("id", ordenId).single();
  if (!pago) return NextResponse.redirect(new URL("/", req.url));

  if (resultado === "aprobado") {
    await admin.from("pagos").update({
      estado: "aprobado",
      referencia_azul: req.nextUrl.searchParams.get("AuthorizationCode") ?? (req.nextUrl.searchParams.get("demo") ? "DEMO" : null),
    }).eq("id", ordenId);
    await admin.from("listings").update({
      estado: "pendiente", // pasa a moderación del admin
      vence_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }).eq("id", pago.listing_id);
    return NextResponse.redirect(new URL("/panel?pago=ok", req.url));
  }

  await admin.from("pagos").update({ estado: "rechazado" }).eq("id", ordenId);
  return NextResponse.redirect(new URL("/publicar?error=pago-rechazado", req.url));
}

export const POST = GET; // Azul puede retornar por POST según configuración
