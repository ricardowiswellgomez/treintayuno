# treseiscinco

treseiscinco es una aplicación web para la operación diaria de pequeños negocios. El frontend usa React + Vite; la autenticación y los datos se gestionan en Supabase; el Worker de Cloudflare sirve la aplicación y la ruta de IA.

## Desarrollo local

Requiere Node.js 22.12 o posterior y npm.

```bash
cp .env.example .env
npm install
npm run dev
```

Las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` son configuración pública del cliente. **Nunca** coloques claves `service_role`, secretos de pagos ni credenciales privadas en variables `VITE_*` ni en archivos que se publiquen al navegador.

## Comprobaciones antes de desplegar

```bash
node --check src/worker.js
npm run build
npx wrangler deploy --dry-run
```

Cloudflare Workers sirve el contenido de `dist/`; `/api/health` permite comprobar que el Worker responde y `/api/ai/chat` requiere una sesión válida y permisos para el negocio consultado.

## Estado de preparación comercial

El workflow `Build treseiscinco` de [GitHub Actions](https://github.com/ricardowiswellgomez/treseiscinco/actions) audita dependencias con `npm audit`, verifica la sintaxis del Worker, compila producción y ejecuta `wrangler deploy --dry-run`. Revisa allí el resultado del commit actual. Un build verde **no** demuestra por sí solo que ventas, pagos reales, permisos y aislamiento entre negocios funcionen de extremo a extremo.

La re-auditoría del 26 de octubre de 2026 añadió límite de frecuencia al checkout, revocó el acceso directo a la RPC de creación de pedidos y exige configurar explícitamente la URL HTTPS de retorno de Wompi. La función de pagos activa está en la versión 7. Cloudflare registra la versión 352 del Worker con el 100 % del tráfico desde las 19:50:39 UTC; aún falta una prueba funcional independiente contra la URL en vivo.

Antes de aceptar negocios y pagos reales, quedan pendientes como mínimo:

1. **Sincronizar las migraciones:** el historial de Supabase registra 66 migraciones, el repositorio contiene 30 archivos SQL y solo 8 identificadores de versión coinciden exactamente. Quedan 58 versiones remotas sin archivo coincidente y 22 archivos SQL no registrados con esa versión. Hay que reconciliar el historial y validar una instalación limpia antes de considerar reproducible el esquema.
2. **Pruebas automatizadas y abuso del checkout:** faltan pruebas de regresión para autenticación, permisos por rol, aislamiento entre negocios, ventas/abonos, stock, cupones, webhooks y pagos duplicados. La creación de pedidos públicos ya pasa por la Edge Function `public-checkout` con límite de 8 solicitudes por IP/negocio cada 10 minutos, y el `EXECUTE` directo de la RPC está revocado para `anon` y `authenticated`. Cloudflare registra un despliegue del Worker al 100 % posterior al commit que enruta el frontend por esa ruta, aunque falta una prueba de humo funcional contra la versión en vivo. También falta una defensa anti-bot adicional.
3. **Seguridad de Auth:** el asesor de Supabase informa que la protección contra contraseñas filtradas está desactivada; activarla en la configuración de Auth.
4. **Dependencias reproducibles:** el workflow ya audita vulnerabilidades altas y Wrangler fue actualizado, pero falta versionar `package-lock.json` para fijar dependencias transitivas.
5. **Prueba operativa de pagos:** probar en sandbox aprobación, rechazo, cancelación, webhook repetido y conciliación de inventario antes de habilitar producción. La función ahora valida JSON, limita el tamaño de solicitud, fija la dependencia del cliente Supabase y no confía en el encabezado `Origin` para construir el retorno de Wompi.
6. **Límite de IA:** el Worker aplica un límite aproximado de 20 solicitudes por usuario por minuto mediante Cloudflare Rate Limiting; no es una cuota global estricta y debe monitorizarse.
7. **Revisión del Worker:** algunas mejoras visuales y de recuperación siguen inyectadas en tiempo de respuesta desde `src/worker.js`. Se retiró un parche obsoleto que dependía del hash del bundle; falta trasladar el resto de esas mejoras al código fuente de React y CSS.

Consulta `docs/GO_LIVE_AUDIT.md` para el resultado de la auditoría y los criterios de salida.

## Separación de proyectos

treseiscinco y el proyecto Supabase `maogebecfottfvlrjbho` son independientes de WíswellArt y NEXUS. No mezclar sus repositorios, credenciales, datos ni recursos.
