/**
 * Integración con Azul Payment Page (redirección).
 * ─────────────────────────────────────────────────
 * IMPORTANTE: los nombres y el orden exacto de los campos del hash
 * se confirman con el kit técnico que Azul entrega al afiliarte.
 * Este módulo deja la estructura lista; ajusta ORDEN_HASH si tu
 * kit difiere. Ambiente de pruebas primero, luego certificación.
 */
import crypto from "crypto";

export type PagoAzul = {
  ordenId: string;      // id del registro en nuestra tabla `pagos`
  monto: number;        // en RD$
  descripcion: string;
};

const ORDEN_HASH = ["MerchantId", "MerchantName", "MerchantType", "CurrencyCode",
  "OrderNumber", "Amount", "ITBIS", "ApprovedUrl", "DeclinedUrl", "CancelUrl"] as const;

export function construirFormularioAzul(p: PagoAzul) {
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  const campos: Record<string, string> = {
    MerchantId: process.env.AZUL_MERCHANT_ID!,
    MerchantName: "Aprovecha.do",
    MerchantType: "E-Commerce",
    CurrencyCode: "$",                          // DOP según kit de Azul
    OrderNumber: p.ordenId,
    Amount: String(Math.round(p.monto * 100)),  // centavos, sin separadores
    ITBIS: "0",
    ApprovedUrl: `${site}/api/pagos/webhook?resultado=aprobado`,
    DeclinedUrl: `${site}/api/pagos/webhook?resultado=rechazado`,
    CancelUrl: `${site}/publicar?cancelado=1`,
  };
  const base = ORDEN_HASH.map((k) => campos[k]).join("") + process.env.AZUL_AUTH_KEY!;
  campos.AuthHash = crypto.createHmac("sha512", process.env.AZUL_AUTH_KEY!).update(base).digest("hex");
  return { action: process.env.AZUL_URL!, campos };
}
