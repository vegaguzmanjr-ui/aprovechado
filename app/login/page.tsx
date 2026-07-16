"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Suspense } from "react";

function LoginForm() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const sp = useSearchParams();
  const [modo, setModo] = useState<"entrar" | "crear">("entrar");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (sp.get("salir")) supabase.auth.signOut().then(() => router.replace("/"));
  }, [sp, supabase, router]);

  const enviar = async () => {
    setError(""); setCargando(true);
    const r = modo === "entrar"
      ? await supabase.auth.signInWithPassword({ email, password: clave })
      : await supabase.auth.signUp({ email, password: clave, options: { data: { nombre } } });
    setCargando(false);
    if (r.error) { setError(r.error.message); return; }
    router.push(sp.get("destino") ?? "/panel");
    router.refresh();
  };

  return (
    <div className="tarjeta" style={{ maxWidth: 440, margin: "40px auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 18 }}>{modo === "entrar" ? "Iniciar sesión" : "Crear cuenta"}</h1>
      <div className="formulario">
        {modo === "crear" && (
          <label>Nombre completo
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="María Peralta" />
          </label>
        )}
        <label>Correo electrónico
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="maria@correo.do" />
        </label>
        <label>Contraseña
          <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} placeholder="Mínimo 6 caracteres" />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={cargando} onClick={enviar}>
          {cargando ? "Un momento…" : modo === "entrar" ? "Entrar" : "Crear cuenta"}
        </button>
        <button className="btn borde" type="button" onClick={() => setModo(modo === "entrar" ? "crear" : "entrar")}>
          {modo === "entrar" ? "No tengo cuenta — crear una" : "Ya tengo cuenta — entrar"}
        </button>
      </div>
    </div>
  );
}

export default function Login() {
  return <Suspense><LoginForm /></Suspense>;
}
