-- ═══════════════════════════════════════════════
-- Aprovecha.do — Datos de ejemplo (anuncios de muestra)
-- Ejecutar DESPUÉS de haberte registrado en el sitio con tu correo.
-- Cómo usar: Supabase Dashboard → SQL Editor → pega y ejecuta este archivo.
--
-- Todos los anuncios quedan a nombre del PRIMER usuario registrado
-- (normalmente tú). Sirven para que el sitio no se vea vacío al lanzar.
-- Cuando tengas anuncios reales, puedes borrarlos con:
--   delete from public.listings where descripcion like '%[EJEMPLO]%';
-- ═══════════════════════════════════════════════

do $$
declare uid uuid;
begin
  select id into uid from auth.users order by created_at limit 1;
  if uid is null then
    raise exception 'Primero regístrate en el sitio con tu correo, luego ejecuta este archivo.';
  end if;

  insert into public.listings
    (owner, tipo, nombre, categoria, ciudad, precio, ingresos, empleados, anos,
     descripcion, telefono, whatsapp, cuota_franquicia, regalias,
     plan, destacado, verificado, estado, vistas, vence_at)
  values
    (uid, 'negocio', 'Restaurante criollo en zona colonial', 'Restaurante', 'Santo Domingo',
     185000, 'US$9,500/mes', 12, 8,
     '[EJEMPLO] Restaurante acreditado en plena Zona Colonial, con clientela fija, cocina equipada y contrato de alquiler vigente. Se vende por retiro del dueño.',
     '809-555-0101', '18095550101', null, null,
     'destacado', true, true, 'activo', 340,
     now() + interval '30 days'),

    (uid, 'negocio', 'Salón de belleza y spa en Piantini', 'Salud & Belleza', 'Santo Domingo',
     72000, 'US$4,200/mes', 6, 5,
     '[EJEMPLO] Salón y spa con cartera de clientes recurrentes, 4 estaciones, sala de uñas y cabina de tratamientos. Marca y redes incluidas.',
     '809-555-0102', '18095550102', null, null,
     'destacado', true, false, 'activo', 512,
     now() + interval '30 days'),

    (uid, 'negocio', 'Colmado con delivery en Santiago', 'Comercio', 'Santiago',
     45000, 'US$3,100/mes', 4, 6,
     '[EJEMPLO] Colmado bien surtido con ruta de delivery propia, nevera de bebidas, y punto de pago. Local en esquina de alto tránsito.',
     '809-555-0103', '18095550103', null, null,
     'estandar', false, true, 'activo', 208,
     now() + interval '30 days'),

    (uid, 'negocio', 'Cafetería frente a universidad', 'Alimentos', 'Santiago',
     38000, 'US$2,700/mes', 5, 3,
     '[EJEMPLO] Cafetería con menú de desayunos y almuerzos, terraza y clientela universitaria estable durante todo el año lectivo.',
     '809-555-0104', '18095550104', null, null,
     'estandar', false, false, 'activo', 176,
     now() + interval '30 days'),

    (uid, 'negocio', 'Gimnasio boutique equipado', 'Fitness', 'Punta Cana',
     130000, 'US$7,800/mes', 8, 4,
     '[EJEMPLO] Gimnasio boutique con equipos nuevos, membresías activas y entrenadores en nómina. Ideal para inversionista del sector turístico.',
     '809-555-0105', '18095550105', null, null,
     'destacado', true, true, 'activo', 421,
     now() + interval '30 days'),

    (uid, 'negocio', 'Taller de mecánica automotriz', 'Automotriz', 'La Vega',
     58000, 'US$3,600/mes', 5, 10,
     '[EJEMPLO] Taller con herramientas, elevador y cartera de clientes de flotillas. Se incluye inventario básico de repuestos.',
     '809-555-0106', '18095550106', null, null,
     'estandar', false, false, 'activo', 143,
     now() + interval '30 days'),

    (uid, 'franquicia', 'Franquicia de heladería artesanal', 'Alimentos', 'Santo Domingo',
     55000, 'ROI estimado 18–24 meses', null, null,
     '[EJEMPLO] Marca dominicana de heladería artesanal en expansión. Incluye recetas, capacitación, imagen de marca y acompañamiento inicial.',
     '809-555-0107', '18095550107', 'US$15,000', '5% de ventas',
     'destacado', true, true, 'activo', 389,
     now() + interval '30 days'),

    (uid, 'franquicia', 'Franquicia de barbería moderna', 'Salud & Belleza', 'Santiago',
     40000, 'ROI estimado 12–18 meses', null, null,
     '[EJEMPLO] Cadena de barberías con concepto moderno, sistema de citas y manual de operaciones. Soporte de mercadeo continuo.',
     '809-555-0108', '18095550108', 'US$10,000', '6% de ventas',
     'estandar', false, false, 'activo', 254,
     now() + interval '30 days');

  raise notice 'Listo: 8 anuncios de ejemplo creados.';
end $$;
