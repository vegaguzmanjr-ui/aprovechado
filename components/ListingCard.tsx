import Link from "next/link";

export type Listing = {
  id: string; tipo: string; nombre: string; categoria: string; ciudad: string;
  precio: number; vistas: number; destacado: boolean; verificado: boolean;
  fotos: string[]; estado?: string;
};

const fmtUS = (n: number) => "US$" + Math.round(n).toLocaleString("en-US");

export default function ListingCard({ l }: { l: Listing }) {
  return (
    <Link href={`/anuncio/${l.id}`} className="card">
      <div className="card-img">
        {l.fotos?.[0]
          ? <img src={l.fotos[0]} alt={l.nombre} />
          : <span className="inicial">{l.nombre.charAt(0)}</span>}
        {l.destacado && <span className="pill lima">★ Destacado</span>}
      </div>
      <div className="card-body">
        <p className="miga">{l.tipo === "franquicia" ? "Franquicia" : "Negocio"} · {l.categoria} · {l.ciudad}{l.verificado ? " · ✓" : ""}</p>
        <h3>{l.nombre}</h3>
        <div className="card-pie">
          <span className="card-precio">{fmtUS(l.precio)}</span>
          <span className="card-vistas">👁 {l.vistas.toLocaleString()}</span>
        </div>
      </div>
    </Link>
  );
}
