import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const fmtRD = (n: number) => "RD$" + Math.round(n).toLocaleString("es-DO");

export default async function Transferencia({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: pago } = await supabase.from("pagos").select("*").eq("id", id).single();
  if (!pago) notFound();

  const banco = {
    nombre: process.env.NEXT_PUBLIC_BANCO_NOMBRE ?? "—",
    cuenta: process.env.NEXT_PUBLIC_BANCO_CUENTA ?? "—",
    titular: process.env.NEXT_PUBLIC_BANCO_TITULAR ?? "Aprovecha.do",
    tipo: process.env.NEXT_PUBLIC_BANCO_TIPO ?? "Cuenta",
  };
  const wa = (process.env.NEXT_PUBLIC_WHATSAPP_SOPORTE ?? "").replace(/[^0-9]/g, "");
  const ref = pago.id.slice(0, 8).toUpperCase();
  const waText = encodeURIComponent(
    `Hola, hice una transferencia para publicar en Aprovecha.do.\nReferencia de mi orden: ${ref}\nPlan: ${pago.plan}\nMonto: ${fmtRD(Number(pago.monto))}\nAdjunto el comprobante.`
  );

  const yaAprobado = pago.estado === "aprobado";

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>Pago por transferencia</h1>
      <p style={{ color: "var(--gris)", marginBottom: 24 }}>
        Realiza la transferencia por el monto exacto y envíanos el comprobante por WhatsApp.
        Tu anuncio se publica en cuanto confirmemos el pago (normalmente el mismo día).
      </p>

      {yaAprobado ? (
        <div className="aviso" style={{ background: "#E1F0E8", color: "var(--verde)", borderColor: "#C8DED2" }}>
          ✓ Este pago ya fue <strong>confirmado</strong>. Tu anuncio está en revisión.
          <div style={{ marginTop: 12 }}><Link className="btn chico" href="/panel">Ir a mis anuncios</Link></div>
        </div>
      ) : (
        <>
          <div className="tarjeta" style={{ marginBottom: 20 }}>
            <div className="kpis" style={{ marginBottom: 0 }}>
              <div className="kpi lima"><span>Monto a transferir</span><strong>{fmtRD(Number(pago.monto))}</strong></div>
              <div className="kpi"><span>Referencia de orden</span><strong style={{ fontSize: 22 }}>{ref}</strong></div>
            </div>
          </div>

          <div className="tarjeta" style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, marginBottom: 16 }}>Datos bancarios</h2>
            <table className="tabla">
              <tbody>
                <tr><th>Banco</th><td>{banco.nombre}</td></tr>
                <tr><th>Tipo de cuenta</th><td>{banco.tipo}</td></tr>
                <tr><th>No. de cuenta</th><td style={{ fontWeight: 700 }}>{banco.cuenta}</td></tr>
                <tr><th>Titular</th><td>{banco.titular}</td></tr>
                <tr><th>Concepto</th><td>Publicación {ref}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="aviso">
            <strong>Importante:</strong> escribe la referencia <strong>{ref}</strong> en el concepto de la
            transferencia para que podamos identificar tu pago rápido.
          </div>

          {wa && (
            <a className="btn-wa" href={`https://wa.me/${wa}?text=${waText}`} target="_blank" rel="noreferrer">
              Enviar comprobante por WhatsApp
            </a>
          )}

          <p style={{ marginTop: 20, fontSize: 13, color: "var(--gris)" }}>
            ¿Ya enviaste el comprobante? Puedes cerrar esta página. Verás el anuncio activo en
            {" "}<Link href="/panel">Mis anuncios</Link> cuando lo confirmemos.
          </p>
        </>
      )}
    </div>
  );
}
