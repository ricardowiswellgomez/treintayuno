# Treintayuno

Base inicial independiente para la plataforma de gestión de pequeños negocios.

## Desarrollo
Requiere Node.js 22.12+ y npm.

```bash
npm install
npm run dev
```

## Compilar y desplegar
```bash
npm run build
npx wrangler deploy
```

Cloudflare Workers sirve la aplicación desde `dist/`. El endpoint `/api/health` comprueba que el Worker responde.

## Estado
Esta es una base inicial, no un sistema comercial terminado. No contiene usuarios, inventario, ventas, clientes ni datos de demostración. La integración con Supabase, autenticación y políticas de aislamiento entre negocios se implementarán antes de almacenar datos reales.

## Separación
Este repositorio y el proyecto Supabase `treintayuno` son independientes de WíswellArt y NEXUS. No añadir secretos, datos ni recursos de esos proyectos.
