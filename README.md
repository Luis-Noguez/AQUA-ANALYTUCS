# AquaAnalytics · Dashboard de Sedes

Dashboard para academias de natación con actualización de datos por Excel.

## Estructura
- `public/index.html` — Dashboard público (acceso libre)
- `admin/index.html` — Panel de administración (protegido por contraseña)
- `netlify/functions/` — Backend serverless

## Variables de entorno en Netlify
- `ADMIN_PASSWORD` — Contraseña para el panel de admin

## URLs
- Dashboard: `https://tu-sitio.netlify.app`
- Admin: `https://tu-sitio.netlify.app/admin`
