import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import ListingCard, { Listing } from "@/components/ListingCard";

export const dynamic = "force-dynamic";
const fmtUS = (n: number) => "US$" + Math.round(n).toLocaleString("en-US");

export default async function Anuncio({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: l } = await supabase.from("listings").select("*").eq("id", id).single();
  if (!l) notFound();

  // Contador de visitas (función security definer, solo cuenta activos)
  await supabase.rpc("increment_views", { listing: id });

  const { data: similares } = await supabase
    .from("listings").select("*")
    .eq("estado", "activo").eq("tipo", l.tipo).neq("id", id).limit(3);

  const waText = encodeURIComponent(`Hola, vi su anuncio «${l.nombre}» en Aprovecha.do y me interesa recibir más información.`);

  return (
    <>
      {l.estado !== "activo" && <div className="aviso">Este anuncio está <strong>{l.estado}</strong> y no es visible al público.</div>}
      <div className="card-img" style={{ height: 320, borderRadius: 16 }}>
        {l.fotos?.[0] ? <img src={l.fotos[0]} alt={l.nombre} /> : <span className="inicial">{l.nombre.charAt(0)}</span>}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 20, margin: "28px 0 8px" }}>
        <div>
          <p className="miga">{l.tipo === "franquicia" ? "Franquicia" : "Negocio"} · {l.categoria} · {l.ciudad}</p>
          <h1 style={{ fontSize: "clamp(28px,3.8vw,42px)", margin: "8px 0" }}>{l.nombre}</h1>
          <div style={{ display: "flex", gap: 10 }}>
            {l.destacado && <span className="pill lima">★ Destacado</span>}
            {l.verificado && <span className="pill verif">✓ Vendedor verificado</span>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "Fraunces,serif", fontSize: 34 }}>{fmtUS(l.precio)}</div>
          <div className="miga">{l.tipo === "franquicia" ? "Inversión inicial" : "Precio de venta"}</div>
        </div>
      </div>
      <p style={{ maxWidth: 720, lineHeight: 1.75, fontSize: 16, margin: "20px 0 32px" }}>{l.descripcion}</p>

      <div className="kpis">
        <div className="kpi"><span>{l.tipo === "franquicia" ? "Retorno estimado" : "Ingresos"}</span><strong>{l.ingresos ?? "—"}</strong></div>
        {l.cuota_franquicia && <div className="kpi"><span>Cuota de franquicia</span><strong>{l.cuota_franquicia}</strong></div>}
        {l.regalias && <div className="kpi"><span>Regalías</span><strong>{l.regalias}</strong></div>}
        <div className="kpi"><span>Empleados</span><strong>{l.empleados ?? "—"}</strong></div>
        <div className="kpi"><span>Años operando</span><strong>{l.anos ?? "—"}</strong></div>
        <div className="kpi"><span>Visitas</span><strong>👁 {l.vistas.toLocaleString()}</strong></div>
      </div>

      <div className="tarjeta" style={{ maxWidth: 640 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16 }}>Contactar al vendedor</h2>
        <p style={{ fontFamily: "Fraunces,serif", fontSize: 24, marginBottom: 16 }}>{l.telefono}</p>
        {l.whatsapp && (
          <a className="btn-wa" href={`https://wa.me/${l.whatsapp}?text=${waText}`} target="_blank" rel="noreferrer">
            Escribir por WhatsApp
          </a>
        )}
        <p style={{ marginTop: 16, fontSize: 12, color: "var(--gris)" }}>
          Verifique documentos y realice su diligencia debida antes de cualquier pago.
        </p>
      </div>

      {!!similares?.length && (
        <section style={{ marginTop: 56 }}>
          <h2 style={{ fontSize: 28, marginBottom: 20 }}>Anuncios similares</h2>
          <div className="grid">{similares.map((s) => <ListingCard key={s.id} l={s as Listing} />)}</div>
        </section>
      )}
    </>
  );
}
