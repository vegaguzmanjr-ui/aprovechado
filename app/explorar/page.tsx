import { supabaseServer } from "@/lib/supabase/server";
import ListingCard, { Listing } from "@/components/ListingCard";

export const dynamic = "force-dynamic";

export default async function Explorar({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const tipo = sp.tipo === "franquicia" ? "franquicia" : "negocio";
  const supabase = await supabaseServer();

  let q = supabase.from("listings").select("*").eq("estado", "activo").eq("tipo", tipo);
  if (sp.ciudad) q = q.eq("ciudad", sp.ciudad);
  if (sp.categoria) q = q.eq("categoria", sp.categoria);
  if (sp.busqueda) q = q.ilike("nombre", `%${sp.busqueda}%`);
  const { data } = await q.order("destacado", { ascending: false }).order("created_at", { ascending: false });

  return (
    <>
      <h1 style={{ fontSize: 36, marginBottom: 8 }}>{tipo === "negocio" ? "Negocios en venta" : "Franquicias disponibles"}</h1>
      <form className="filtros">
        <input type="hidden" name="tipo" value={tipo} />
        <input name="busqueda" placeholder="Buscar…" defaultValue={sp.busqueda ?? ""} />
        <input name="ciudad" placeholder="Ciudad" defaultValue={sp.ciudad ?? ""} />
        <input name="categoria" placeholder="Categoría" defaultValue={sp.categoria ?? ""} />
        <button className="btn chico" type="submit">Filtrar</button>
      </form>
      {data?.length
        ? <div className="grid">{data.map((l) => <ListingCard key={l.id} l={l as Listing} />)}</div>
        : <p style={{ color: "var(--gris)", padding: "40px 0" }}>No hay resultados con esos filtros.</p>}
    </>
  );
}
