# Auditoría de salida a producción — Treintayuno

Fecha de revisión: 26 de octubre de 2026.

## Decisión

**NO APTO todavía para una apertura pública con pagos reales.** El frontend compila y la base de datos conectada está activa, pero la compilación no demuestra la seguridad ni la corrección de los flujos transaccionales de extremo a extremo.

## Comprobaciones confirmadas

- GitHub Actions compiló correctamente el commit `38d74d2bc1a3968f7c163e62c40cc348078dfbae`.
- La base Supabase `maogebecfottfvlrjbho` está en estado `ACTIVE_HEALTHY`, PostgreSQL 17.
- El asesor de Supabase no detecta una fuga directa de secretos de pago en la salida revisada. Las funciones `SECURITY DEFINER` que permiten llamadas públicas requieren revisión por función; el aviso por sí solo no prueba una vulnerabilidad.
- Las tablas de pedidos públicos y credenciales de pago tienen RLS activado sin políticas directas. Eso es deliberado si el acceso ocurre únicamente a través de RPC cuidadosamente validadas o del servicio de servidor; no se deben añadir políticas abiertas para silenciar el aviso.
- Se aplicó en Supabase y se versionó la migración `20261026190000_add_missing_foreign_key_indexes.sql` para cubrir ocho claves foráneas que el asesor marcó sin índices.

## Bloqueadores antes de vender el servicio

### P0 — Migraciones fuera de sincronía

La base conectada registra migraciones posteriores a `20261024010000_convert_business_catalog_currency.sql` que no están representadas como archivos SQL en el repositorio. Incluyen pedidos del catálogo, pagos verificados, cupones, integraciones Wompi por negocio, auditoría y privacidad de la tarjeta comercial.

**Riesgo:** un entorno nuevo o una restauración desde Git no puede reconstruir de forma fiable el esquema actual; el historial remoto y el historial versionado no son reproducibles entre sí.

**Corrección necesaria:** recuperar y versionar el SQL original de cada migración faltante, comprobar que el contenido coincide con la base conectada y probar una instalación limpia en una base de desarrollo. No marcar migraciones como revertidas ni recrear el esquema a ciegas en producción.

### P0 — Pruebas transaccionales y de aislamiento

No se encontró una suite automatizada de pruebas funcionales. Antes de habilitar producción deben comprobarse con dos negocios y perfiles distintos, como mínimo:

- un usuario de un negocio no puede leer ni modificar clientes, productos, compras, ventas, auditorías o pagos del otro;
- cada permiso de empleado se aplica en el servidor, no solo ocultando botones;
- dos ventas simultáneas no dejan stock negativo ni duplican movimientos;
- abonos, saldos y pagos completos conservan sus importes y su moneda;
- un webhook Wompi inválido, repetido o para otro negocio no confirma una venta;
- pedidos aprobados, rechazados y cancelados actualizan pedido, venta, pago e inventario de forma coherente;
- cupones vencidos, agotados, concurrentes o que dejarían el total en cero se rechazan;
- el canal WhatsApp no requiere credenciales Wompi y muestra un pedido con total correcto;
- el catálogo público no revela documentos privados, datos internos ni credenciales.

### P1 — Ajustes de seguridad de Supabase Auth

El asesor informa que la protección de contraseñas filtradas está desactivada. Activarla en la configuración de Auth y probar registro, inicio de sesión, recuperación y cambio de contraseña.

El asesor también marca funciones `SECURITY DEFINER` ejecutables por `anon` o `authenticated`. Algunas son intencionalmente públicas (catálogo, cotización de cupón y creación de pedido). Revisar que cada una tenga `search_path` fijo, validación de negocio/propiedad, límites de entrada y una respuesta que no exponga datos personales. Mantener el acceso directo bloqueado a las tablas de pedidos y secretos de pago.

### P1 — Worker y mantenimiento de interfaz

`src/worker.js` todavía inyecta estilos y un script en las respuestas HTML. Se retiró el parche obsoleto condicionado al hash del bundle (la compilación actual generaba `index-xhP7nsMn.js`, mientras el parche apuntaba a `index-BY_d2kG1.js` y nunca se ejecutaba).

**Corrección estructural pendiente:** migrar cada comportamiento restante al código fuente React/CSS y comprobar las rutas de recuperación, imágenes del catálogo y diseños móviles sin mutación de HTML en tiempo de respuesta.

### P1 — Protección contra abuso de la IA

La ruta de IA valida sesión y pertenencia al negocio, lo cual es positivo. Falta confirmar un límite de solicitudes por usuario/negocio y una política de uso/costo en producción. Configurar límites en Cloudflare y observar errores, latencia y consumo antes de abrirla a todos.

### P2 — Calidad y rendimiento

- Se corrigieron ocho índices de claves foráneas reportados por Supabase.
- El asesor también muestra índices sin uso; no eliminarlos hasta contar con carga representativa y métricas.
- Añadir pruebas automatizadas para importes en monedas de 0, 2 y 3 decimales.
- Probar los diseños en teléfonos pequeños, tabletas, teclado virtual, zoom y conexión lenta.
- Añadir alertas operativas para errores del Worker, errores de Supabase y webhooks fallidos.

## Condiciones mínimas de salida

- [ ] Todas las migraciones remotas tienen su SQL versionado y reproducible.
- [ ] Migración limpia validada en un proyecto de desarrollo.
- [ ] Pruebas de aislamiento multiempresa y permisos aprobadas.
- [ ] Pruebas de ventas, compras, stock, abonos y cupones aprobadas.
- [ ] Wompi sandbox probado de extremo a extremo, incluidos webhooks repetidos y rechazados.
- [ ] Protección de contraseñas filtradas activada.
- [ ] Se eliminó la inyección frágil de scripts por parte del Worker.
- [ ] Se configuraron límites y monitoreo para la IA.
- [ ] Se probó restauración de base de datos y se definió cómo atender incidentes.

No declarar el producto listo para pagos reales hasta cerrar los bloqueadores P0 y validar los casos críticos en un entorno de pruebas.
