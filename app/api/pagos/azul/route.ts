import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { construirFormularioAzul } from "@/lib/azul";

/**
 * Crea el registro de pago y devuelve una página HTML que se
 * auto-envía (POST) al Payment Page de Azul con el hash firmado.
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
    .insert({ listing_id: listingId, owner: user.id, plan, monto })
    .select("id").single();
  if (!pago) return NextResponse.redirect(new URL("/publicar?error=pago", req.url));

  // Sin credenciales de Azul todavía → modo demo: aprobar directo (SOLO desarrollo)
  if (!process.env.AZUL_MERCHANT_ID) {
    return NextResponse.redirect(new URL(`/api/pagos/webhook?resultado=aprobado&OrderNumber=${pago.id}&demo=1`, req.url));
  }

  const { action, campos } = construirFormularioAzul({
    ordenId: pago.id, monto, descripcion: `Publicación ${plan} Aprovecha.do`,
  });
  const inputs = Object.entries(campos)
    .map(([k, v]) => `<input type="hidden" name="${k}" value="${v}">`)
    .join("");
  return new NextResponse(
    `<!doctype html><html><body onload="document.forms[0].submit()">
      <p style="font-family:sans-serif">Redirigiendo al pago seguro de Azul…</p>
      <form method="POST" action="${action}">${inputs}</form>
    </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
