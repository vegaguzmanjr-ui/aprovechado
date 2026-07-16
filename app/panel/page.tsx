import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const LBL: Record<string, string> = { borrador: "Sin pagar", pendiente: "En revisión", activo: "Activo", pausado: "Pausado", rechazado: "Rechazado", vencido: "Vencido" };

export default async function Panel() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?destino=/panel");

  const { data: mios } = await supabase.from("listings").select("*")
    .eq("owner", user.id).order("created_at", { ascending: false });

  const visitas = (mios ?? []).reduce((s, l) => s + l.vistas, 0);

  return (
    <>
      <h1 style={{ fontSize: 34, marginBottom: 20 }}>Mis anuncios</h1>
      <div className="kpis">
        <div className="kpi"><span>Anuncios</span><strong>{mios?.length ?? 0}</strong></div>
        <div className="kpi"><span>Visitas totales</span><strong>👁 {visitas.toLocaleString()}</strong></div>
        <div className="kpi"><span>Activos</span><strong>{mios?.filter((l) => l.estado === "activo").length ?? 0}</strong></div>
      </div>
      {!mios?.length ? (
        <p style={{ color: "var(--gris)" }}>Aún no ha publicado. <Link href="/publicar">Publique su primer anuncio →</Link></p>
      ) : (
        <table className="tabla">
          <thead><tr><th>Anuncio</th><th>Estado</th><th>Visitas</th><th>Vence</th><th></th></tr></thead>
          <tbody>
            {mios.map((l) => (
              <tr key={l.id}>
                <td><Link href={`/anuncio/${l.id}`} style={{ fontFamily: "Fraunces,serif", fontSize: 17 }}>{l.nombre}</Link></td>
                <td><span className={`chip-estado ${l.estado}`}>{LBL[l.estado]}</span></td>
                <td>👁 {l.vistas.toLocaleString()}</td>
                <td>{l.vence_at ? new Date(l.vence_at).toLocaleDateString("es-DO") : "—"}</td>
                <td>{(l.estado === "vencido" || l.estado === "borrador") && (
                  <a className="btn chico" href={`/api/pagos/azul?listing=${l.id}&plan=${l.plan ?? "estandar"}`}>
                    {l.estado === "borrador" ? "Pagar" : "Renovar"}
                  </a>
                )}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
