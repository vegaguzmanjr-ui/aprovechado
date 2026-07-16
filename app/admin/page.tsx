import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const LBL: Record<string, string> = { borrador: "Sin pagar", pendiente: "En revisión", activo: "Activo", pausado: "Pausado", rechazado: "Rechazado", vencido: "Vencido" };

async function requireAdmin() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?destino=/admin");
  const { data } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  if (data?.rol !== "admin") redirect("/");
  return supabase;
}

async function cambiarEstado(formData: FormData) {
  "use server";
  const supabase = await requireAdmin();
  await supabase.from("listings")
    .update({ estado: String(formData.get("estado")) })
    .eq("id", String(formData.get("id")));
  revalidatePath("/admin");
}

async function alternarDestacado(formData: FormData) {
  "use server";
  const supabase = await requireAdmin();
  const id = String(formData.get("id"));
  const { data } = await supabase.from("listings").select("destacado").eq("id", id).single();
  await supabase.from("listings").update({ destacado: !data?.destacado }).eq("id", id);
  revalidatePath("/admin");
}

async function alternarVerificado(formData: FormData) {
  "use server";
  const supabase = await requireAdmin();
  const id = String(formData.get("id"));
  const { data } = await supabase.from("listings").select("verificado").eq("id", id).single();
  await supabase.from("listings").update({ verificado: !data?.verificado }).eq("id", id);
  revalidatePath("/admin");
}

async function confirmarTransferencia(formData: FormData) {
  "use server";
  const supabase = await requireAdmin();
  const pagoId = String(formData.get("pago"));
  const { data: pago } = await supabase.from("pagos").select("*").eq("id", pagoId).single();
  if (!pago) return;
  await supabase.from("pagos").update({ estado: "aprobado", referencia_azul: "TRANSFER" }).eq("id", pagoId);
  await supabase.from("listings").update({
    estado: "pendiente",
    vence_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }).eq("id", pago.listing_id);
  revalidatePath("/admin");
}

async function rechazarTransferencia(formData: FormData) {
  "use server";
  const supabase = await requireAdmin();
  await supabase.from("pagos").update({ estado: "rechazado" }).eq("id", String(formData.get("pago")));
  revalidatePath("/admin");
}

export default async function Admin() {
  const supabase = await requireAdmin();
  const { data: listings } = await supabase.from("listings").select("*").order("created_at", { ascending: false });
  const { data: pagos } = await supabase.from("pagos").select("monto,estado,created_at").eq("estado", "aprobado");
  const { data: transferencias } = await supabase.from("pagos")
    .select("id,monto,plan,created_at,listing_id,listings(nombre,ciudad,telefono)")
    .eq("metodo", "transferencia").eq("estado", "pendiente")
    .order("created_at", { ascending: false });

  const inicioMes = new Date(); inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0);
  const ingresosMes = (pagos ?? []).filter((p) => new Date(p.created_at) >= inicioMes).reduce((s, p) => s + Number(p.monto), 0);
  const pendientes = (listings ?? []).filter((l) => l.estado === "pendiente");

  return (
    <>
      <h1 style={{ fontSize: 34, marginBottom: 20 }}>Panel de administración</h1>
      <div className="kpis">
        <div className="kpi lima"><span>Ingresos del mes</span><strong>RD${ingresosMes.toLocaleString()}</strong></div>
        <div className="kpi"><span>Activos</span><strong>{(listings ?? []).filter((l) => l.estado === "activo").length}</strong></div>
        <div className="kpi"><span>En revisión</span><strong>{pendientes.length}</strong></div>
        <div className="kpi"><span>Pagos aprobados</span><strong>{pagos?.length ?? 0}</strong></div>
      </div>

      <h2 style={{ fontSize: 24, margin: "28px 0 14px" }}>Transferencias por confirmar {(transferencias?.length ?? 0) > 0 && `(${transferencias!.length})`}</h2>
      {!transferencias?.length ? <p style={{ color: "var(--gris)" }}>No hay transferencias pendientes ✓</p> : (
        <table className="tabla">
          <thead><tr><th>Anuncio</th><th>Plan</th><th>Monto</th><th>Referencia</th><th>Acciones</th></tr></thead>
          <tbody>
            {transferencias.map((t: any) => (
              <tr key={t.id}>
                <td>{t.listings?.nombre ?? "—"}<br /><small>{t.listings?.ciudad} · Tel {t.listings?.telefono}</small></td>
                <td>{t.plan}</td>
                <td>RD${Number(t.monto).toLocaleString()}</td>
                <td><code>{String(t.id).slice(0, 8).toUpperCase()}</code></td>
                <td style={{ display: "flex", gap: 8 }}>
                  <form action={confirmarTransferencia}><input type="hidden" name="pago" value={t.id} /><button className="btn chico">✓ Confirmar pago</button></form>
                  <form action={rechazarTransferencia}><input type="hidden" name="pago" value={t.id} /><button className="btn chico peligro">✕ Rechazar</button></form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 style={{ fontSize: 24, margin: "28px 0 14px" }}>Moderación {pendientes.length > 0 && `(${pendientes.length})`}</h2>
      {!pendientes.length ? <p style={{ color: "var(--gris)" }}>No hay anuncios pendientes ✓</p> : (
        <table className="tabla">
          <thead><tr><th>Anuncio</th><th>Precio</th><th>Plan</th><th>Acciones</th></tr></thead>
          <tbody>
            {pendientes.map((l) => (
              <tr key={l.id}>
                <td><Link href={`/anuncio/${l.id}`}>{l.nombre}</Link><br /><small>{l.tipo} · {l.categoria} · {l.ciudad} · Tel {l.telefono}</small></td>
                <td>US${Number(l.precio).toLocaleString()}</td>
                <td>{l.plan}</td>
                <td style={{ display: "flex", gap: 8 }}>
                  <form action={cambiarEstado}><input type="hidden" name="id" value={l.id} /><input type="hidden" name="estado" value="activo" /><button className="btn chico">✓ Aprobar</button></form>
                  <form action={cambiarEstado}><input type="hidden" name="id" value={l.id} /><input type="hidden" name="estado" value="rechazado" /><button className="btn chico peligro">✕ Rechazar</button></form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 style={{ fontSize: 24, margin: "34px 0 14px" }}>Todos los anuncios</h2>
      <table className="tabla">
        <thead><tr><th>Anuncio</th><th>Estado</th><th>Visitas</th><th>Destacado</th><th>Verificado</th><th>Acciones</th></tr></thead>
        <tbody>
          {(listings ?? []).map((l) => (
            <tr key={l.id}>
              <td><Link href={`/anuncio/${l.id}`}>{l.nombre}</Link></td>
              <td><span className={`chip-estado ${l.estado}`}>{LBL[l.estado]}</span></td>
              <td>👁 {l.vistas.toLocaleString()}</td>
              <td>
                <form action={alternarDestacado}><input type="hidden" name="id" value={l.id} /><button className="btn chico borde">{l.destacado ? "★ Sí" : "☆ No"}</button></form>
              </td>
              <td>
                <form action={alternarVerificado}><input type="hidden" name="id" value={l.id} /><button className="btn chico borde">{l.verificado ? "✓ Sí" : "○ No"}</button></form>
              </td>
              <td>
                <form action={cambiarEstado} style={{ display: "inline" }}>
                  <input type="hidden" name="id" value={l.id} />
                  <input type="hidden" name="estado" value={l.estado === "pausado" ? "activo" : "pausado"} />
                  <button className="btn chico borde">{l.estado === "pausado" ? "Activar" : "Pausar"}</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
