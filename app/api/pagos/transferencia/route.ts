import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Pago por TRANSFERENCIA BANCARIA (confirmación manual).
 * Crea el registro de pago en estado "pendiente" y lleva al vendedor
 * a una página con los datos bancarios y un botón de WhatsApp para
 * enviar el comprobante. El admin confirma el pago desde /admin.
 */
export async function GET(req: NextRequest) {
  const listingId = req.nextUrl.searchParams.get("listing");
  const plan = req.nextUrl.searchParams.get("plan") === "destacado" ? "destacado" : "estandar";
  if (!listingId) return NextResponse.redirect(new URL("/publicar", req.url));

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login?destino=/publicar", req.url));

  const monto = plan === "destacado"
    ? Number(process.env.PRECIO_DESTACADO ?? 6500)
    : Number(process.env.PRECIO_ESTANDAR ?? 2500);

  const { data: pago } = await supabase.from("pagos")
    .insert({ listing_id: listingId, owner: user.id, plan, monto, metodo: "transferencia" })
    .select("id").single();
  if (!pago) return NextResponse.redirect(new URL("/publicar?error=pago", req.url));

  return NextResponse.redirect(new URL(`/transferencia/${pago.id}`, req.url));
}
