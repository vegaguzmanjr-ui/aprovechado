# Aprovecha.do — Marketplace de negocios y franquicias de RD

Proyecto de producción: Next.js 15 (App Router) + Supabase (base de datos,
autenticación y fotos) + Azul Payment Page (pagos con tarjeta en RD).

## Qué incluye
- Catálogo público de negocios y franquicias con filtros y anuncios similares
- Registro / inicio de sesión de vendedores (correo y contraseña)
- Publicación con subida de fotos, plan Estándar o Destacado
- Pago con Azul (tarjeta) **o transferencia bancaria** → el anuncio pasa a "En revisión" → el admin lo aprueba
- Contador de visitas por anuncio y contacto directo por WhatsApp
- Panel del vendedor (estados, visitas, renovar)
- Panel de administración (ingresos del mes, moderación, pausar, destacar)
- Vencimiento automático a los 30 días (con el cron sugerido)
- Pago por **transferencia bancaria** con confirmación manual desde el panel admin (ideal para RD)
- Insignia de **vendedor verificado** que el admin activa por anuncio
- **Datos de ejemplo** (`supabase/seed.sql`) para que el sitio no se vea vacío al lanzar
- Middleware que **mantiene la sesión activa** (login estable)
- **Modo demo**: sin credenciales de Azul, el pago con tarjeta se aprueba solo (para probar todo el flujo antes de tener la pasarela)

## Puesta en marcha (30–45 min)

### 1. Supabase (gratis)
1. Cree un proyecto en supabase.com
2. SQL Editor → pegue y ejecute `supabase/schema.sql`
3. Settings → API: copie URL, anon key y service_role key

### 2. Variables de entorno
```bash
cp .env.example .env.local   # y complete los valores de Supabase
```

### 3. Correr local
```bash
npm install
npm run dev   # http://localhost:3000
```
Regístrese con su correo y luego, en el SQL Editor, hágase admin:
```sql
update profiles set rol='admin' where id = (select id from auth.users where email='SU-CORREO');
```

### 4. Deploy en Vercel (gratis)
1. Suba el proyecto a GitHub
2. vercel.com → Import Project → agregue las mismas variables de entorno
3. Conecte el dominio aprovecha.do (registrado en NIC.do) en Settings → Domains

### 5. Pagos reales con Azul
1. Afíliese a Azul E-Commerce (requiere RNC y cuenta bancaria empresarial)
2. Reciba el kit técnico: MerchantId, AuthKey y URL de pruebas
3. Complete las variables AZUL_* — el modo demo se apaga solo
4. Verifique en `lib/azul.ts` que el orden de campos del hash coincida con su kit
5. Pase la certificación de Azul y cambie AZUL_URL a producción

### 6. Vencimiento automático
Supabase → Integrations → Cron → tarea diaria:
```sql
update listings set estado='vencido' where estado='activo' and vence_at < now();
```

## Estructura
```
app/               páginas (App Router)
  explorar/        catálogo con filtros
  anuncio/[id]/    detalle + visitas + WhatsApp
  publicar/        formulario + fotos + planes
  panel/           panel del vendedor
  admin/           moderación e ingresos (solo rol admin)
  api/pagos/       redirección a Azul y webhook de retorno
components/        Nav, ListingCard
lib/               clientes Supabase y módulo Azul
supabase/          schema.sql (tablas, RLS, funciones)
```

## Seguridad
- Row Level Security en todas las tablas: cada vendedor solo ve/edita lo suyo
- El rol admin se verifica en el servidor (no se puede falsear desde el navegador)
- El contador de visitas usa una función `security definer` (nadie puede editar anuncios ajenos)
- La service_role key solo se usa en el webhook del servidor
