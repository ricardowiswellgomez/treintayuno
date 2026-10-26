# Treintayuno

Treintayuno es una aplicación web para la operación diaria de pequeños negocios. El frontend usa React + Vite; la autenticación y los datos se gestionan en Supabase; el Worker de Cloudflare sirve la aplicación y la ruta de IA.

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

El workflow `Build Treintayuno` de [GitHub Actions](https://github.com/ricardowiswellgomez/treintayuno/actions) verifica sintaxis del Worker, compilación de producción y `wrangler deploy --dry-run`. Revisa allí el resultado del commit actual. Un build verde **no** demuestra por sí solo que ventas, pagos reales, permisos y aislamiento entre negocios funcionen de extremo a extremo.

Antes de aceptar negocios y pagos reales, quedan pendientes como mínimo:

1. **Sincronizar las migraciones:** la base de datos conectada tiene migraciones posteriores a la última migración SQL versionada en este repositorio. Deben incorporarse y verificarse en orden para que una instalación nueva reproduzca el esquema actual.
2. **Pruebas automatizadas:** faltan pruebas de regresión para autenticación, permisos por rol, aislamiento entre negocios, ventas/abonos, stock, cupones, webhooks y pagos duplicados.
3. **Seguridad de Auth:** el asesor de Supabase informa que la protección contra contraseñas filtradas está desactivada; activarla en la configuración de Auth.
4. **Prueba operativa de pagos:** probar en sandbox aprobación, rechazo, cancelación, webhook repetido y conciliación de inventario antes de habilitar producción.
5. **Revisión del Worker:** algunas mejoras visuales y de recuperación siguen inyectadas en tiempo de respuesta desde `src/worker.js`. Se retiró un parche obsoleto que dependía del hash del bundle; falta trasladar el resto de esas mejoras al código fuente de React y CSS.

Consulta `docs/GO_LIVE_AUDIT.md` para el resultado de la auditoría y los criterios de salida.

## Separación de proyectos

Treintayuno y el proyecto Supabase `maogebecfottfvlrjbho` son independientes de WíswellArt y NEXUS. No mezclar sus repositorios, credenciales, datos ni recursos.
