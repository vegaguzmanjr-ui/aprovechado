"use client";
import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

const CATEGORIAS = ["Restaurante","Hotel & Turismo","Comercio","Salud & Belleza","Servicios","Alimentos","Fitness","Automotriz"];
const CIUDADES = ["Santo Domingo","Santiago","Punta Cana","Puerto Plata","La Romana","Las Terrenas","San Pedro de Macorís","La Vega"];

function FormPublicar() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const [f, setF] = useState<any>({ tipo: "negocio", categoria: CATEGORIAS[0], ciudad: CIUDADES[0] });
  const [fotos, setFotos] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  const enviar = async (plan: "estandar" | "destacado", metodo: "azul" | "transferencia" = "azul") => {
    setError("");
    if (!f.nombre?.trim()) return setError("Escriba el nombre del anuncio.");
    if (!f.precio || Number(f.precio) <= 0) return setError("Indique un precio válido.");
    if (!f.telefono?.trim()) return setError("Indique un teléfono de contacto.");
    setCargando(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login?destino=/publicar"); return; }

    // 1) Subir fotos al bucket
    const urls: string[] = [];
    for (const foto of fotos.slice(0, 6)) {
      const ruta = `${user.id}/${Date.now()}-${foto.name}`;
      const { error: e } = await supabase.storage.from("fotos").upload(ruta, foto);
      if (!e) urls.push(supabase.storage.from("fotos").getPublicUrl(ruta).data.publicUrl);
    }

    // 2) Crear anuncio en borrador
    const { data: listing, error: eIns } = await supabase.from("listings").insert({
      owner: user.id, tipo: f.tipo, nombre: f.nombre, categoria: f.categoria, ciudad: f.ciudad,
      precio: Number(f.precio), ingresos: f.ingresos, empleados: Number(f.empleados) || null,
      anos: Number(f.anos) || null, descripcion: f.descripcion, telefono: f.telefono,
      whatsapp: (f.whatsapp || f.telefono).replace(/[^0-9]/g, ""),
      cuota_franquicia: f.cuotaFranquicia, regalias: f.regalias,
      fotos: urls, plan, destacado: plan === "destacado", estado: "borrador",
    }).select("id").single();
    if (eIns || !listing) { setCargando(false); return setError("No se pudo crear el anuncio. Intente de nuevo."); }

    // 3) Redirigir al pago (tarjeta con Azul o transferencia bancaria)
    const ruta = metodo === "transferencia" ? "transferencia" : "azul";
    router.push(`/api/pagos/${ruta}?listing=${listing.id}&plan=${plan}`);
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 34, marginBottom: 20 }}>Venda su negocio o franquicia</h1>
      <div className="tarjeta formulario">
        <label>Tipo de anuncio
          <select value={f.tipo} onChange={(e) => set("tipo", e.target.value)}>
            <option value="negocio">Negocio en venta</option>
            <option value="franquicia">Franquicia</option>
          </select>
        </label>
        <label>Nombre *
          <input value={f.nombre ?? ""} onChange={(e) => set("nombre", e.target.value)} />
        </label>
        <div className="fila2">
          <label>Categoría
            <select value={f.categoria} onChange={(e) => set("categoria", e.target.value)}>{CATEGORIAS.map((c) => <option key={c}>{c}</option>)}</select>
          </label>
          <label>Ciudad
            <select value={f.ciudad} onChange={(e) => set("ciudad", e.target.value)}>{CIUDADES.map((c) => <option key={c}>{c}</option>)}</select>
          </label>
        </div>
        <div className="fila2">
          <label>{f.tipo === "franquicia" ? "Inversión inicial (US$) *" : "Precio de venta (US$) *"}
            <input type="number" value={f.precio ?? ""} onChange={(e) => set("precio", e.target.value)} />
          </label>
          <label>{f.tipo === "franquicia" ? "Retorno estimado" : "Ingresos mensuales"}
            <input value={f.ingresos ?? ""} onChange={(e) => set("ingresos", e.target.value)} />
          </label>
        </div>
        {f.tipo === "franquicia" && (
          <div className="fila2">
            <label>Cuota de franquicia
              <input value={f.cuotaFranquicia ?? ""} onChange={(e) => set("cuotaFranquicia", e.target.value)} />
            </label>
            <label>Regalías
              <input value={f.regalias ?? ""} onChange={(e) => set("regalias", e.target.value)} />
            </label>
          </div>
        )}
        <div className="fila2">
          <label>Empleados
            <input type="number" value={f.empleados ?? ""} onChange={(e) => set("empleados", e.target.value)} />
          </label>
          <label>Años operando
            <input type="number" value={f.anos ?? ""} onChange={(e) => set("anos", e.target.value)} />
          </label>
        </div>
        <div className="fila2">
          <label>Teléfono *
            <input value={f.telefono ?? ""} onChange={(e) => set("telefono", e.target.value)} placeholder="809-555-0000" />
          </label>
          <label>WhatsApp (con código de país)
            <input value={f.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value)} placeholder="18095550000" />
          </label>
        </div>
        <label>Descripción
          <textarea rows={4} value={f.descripcion ?? ""} onChange={(e) => set("descripcion", e.target.value)} />
        </label>
        <label>Fotos (hasta 6)
          <input type="file" accept="image/*" multiple onChange={(e) => setFotos(Array.from(e.target.files ?? []).slice(0, 6))} />
        </label>
        {error && <p className="error">{error}</p>}
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--gris)", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".02em" }}>Pagar con tarjeta</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="btn" disabled={cargando} onClick={() => enviar("estandar", "azul")}>
              Estándar — RD${Number(process.env.NEXT_PUBLIC_PRECIO_ESTANDAR ?? 2500).toLocaleString()}
            </button>
            <button className="btn lima" disabled={cargando} onClick={() => enviar("destacado", "azul")}>
              ★ Destacado — RD${Number(process.env.NEXT_PUBLIC_PRECIO_DESTACADO ?? 6500).toLocaleString()}
            </button>
          </div>
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--gris)", margin: "6px 0 10px", textTransform: "uppercase", letterSpacing: ".02em" }}>Pagar por transferencia bancaria</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="btn borde" disabled={cargando} onClick={() => enviar("estandar", "transferencia")}>
              Estándar — RD${Number(process.env.NEXT_PUBLIC_PRECIO_ESTANDAR ?? 2500).toLocaleString()}
            </button>
            <button className="btn borde" disabled={cargando} onClick={() => enviar("destacado", "transferencia")}>
              ★ Destacado — RD${Number(process.env.NEXT_PUBLIC_PRECIO_DESTACADO ?? 6500).toLocaleString()}
            </button>
          </div>
        </div>
        <p style={{ fontSize: 13, color: "var(--gris)" }}>
          Tras confirmar el pago, su anuncio pasa a revisión y se publica en menos de 24 horas por 30 días.
          Con transferencia, le mostraremos los datos bancarios y confirmaremos al recibir el comprobante.
        </p>
      </div>
    </div>
  );
}

export default function Publicar() {
  return <Suspense><FormPublicar /></Suspense>;
}
