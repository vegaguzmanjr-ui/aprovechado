import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Aprovecha.do — Negocios y franquicias en venta en República Dominicana",
  description: "El marketplace dominicano para comprar y vender negocios en marcha y franquicias. Contacto directo por WhatsApp, sin comisiones de venta.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Nav />
        <main>{children}</main>
        <footer className="pie">
          <p>© {new Date().getFullYear()} Aprovecha.do — El mercado dominicano donde los negocios cambian de manos.</p>
        </footer>
      </body>
    </html>
  );
}
