import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import ListingCard, { Listing } from "@/components/ListingCard";

export const revalidate = 60;

export default async function Home() {
  const supabase = await supabaseServer();
  const { data: destacados } = await supabase
    .from("listings").select("*")
    .eq("estado", "activo").eq("destacado", true)
    .order("created_at", { ascending: false }).limit(6);

  return (
    <>
      <section style={{ padding: "40px 0 56px", maxWidth: 720 }}>
        <span className="pill lima">Marketplace de negocios en RD</span>
        <h1 style={{ fontSize: "clamp(38px,5.4vw,62px)", lineHeight: 1.05, margin: "20px 0 16px" }}>
          La oportunidad está servida. <em>Aprovéchala.</em>
        </h1>
        <p style={{ color: "var(--gris)", fontSize: 17, marginBottom: 28 }}>
          Negocios en marcha y franquicias en toda República Dominicana.
          Contacto directo por WhatsApp, sin comisiones de venta.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/explorar?tipo=negocio" className="btn">Explorar negocios</Link>
          <Link href="/explorar?tipo=franquicia" className="btn borde">Ver franquicias</Link>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 32, marginBottom: 24 }}>Oportunidades destacadas</h2>
        {destacados?.length
          ? <div className="grid">{destacados.map((l) => <ListingCard key={l.id} l={l as Listing} />)}</div>
          : <p style={{ color: "var(--gris)" }}>Pronto habrá anuncios destacados aquí. <Link href="/publicar">Sea el primero →</Link></p>}
      </section>
    </>
  );
}
