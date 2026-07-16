import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

export default async function Nav() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  let esAdmin = false;
  if (user) {
    const { data } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
    esAdmin = data?.rol === "admin";
  }
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="marca"><span className="marca-punto" />Aprovecha<span className="marca-do">.do</span></Link>
        <nav className="nav">
          <Link href="/explorar?tipo=negocio">Negocios</Link>
          <Link href="/explorar?tipo=franquicia">Franquicias</Link>
          <Link href="/panel">Mis anuncios</Link>
          {esAdmin && <Link href="/admin">⚙ Admin</Link>}
          {user
            ? <Link href="/login?salir=1">Salir</Link>
            : <Link href="/login">Entrar</Link>}
          <Link href="/publicar" className="btn">Publicar</Link>
        </nav>
      </div>
    </header>
  );
}
