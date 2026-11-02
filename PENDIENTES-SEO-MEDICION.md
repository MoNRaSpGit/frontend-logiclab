# SEO técnico y medición — pendientes para el usuario

Hecho ya en el código (nada que cargar): title/meta description/`lang="es"`,
orden h1/h2, datos estructurados JSON-LD, `og:image`/favicon, alt descriptivos
por rubro, `robots.txt`, `sitemap.xml`, canonical.

## 1. Google Search Console (gratis)

1. Entrar a https://search.google.com/search-console con la cuenta de Google.
2. Agregar la propiedad `https://monraspgit.github.io/frontend-logiclab/`.
3. Elegir verificación por "etiqueta HTML" (meta tag).
4. Pasar el `content="..."` que da Google — se pega en `index.html`, en la
   línea comentada `<!-- <meta name="google-site-verification" ... /> -->`
   (descomentarla).

## 2. Contador de visitas — propio, sin cuenta externa (02/11/2026)

Se sacó GoatCounter: el usuario pidió los datos en su propia base. Ahora
`script.js` manda cada evento al backend (`POST /logiclab/events/track`,
módulo `backend/src/modules/logiclab/`), que los guarda en la tabla
`saas_logiclab_events` (migración `db/migrations/115_saas_logiclab_events.sql`).
Sin cookies; nunca se guarda la IP tal cual, solo un hash con sal
(`visitor_hash`) para aproximar visitantes únicos por día.

Ya queda contando automáticamente: visitas por día y únicos aproximados,
de dónde vienen (`?src=...`), "Ver video" por rubro, clics de WhatsApp por
sección (con la keyword del rubro cuando corresponde), y apertura del
cotizador + "enviar presupuesto" por rubro/plan.

**Para verlo:** `node scripts/inspect-logiclab-visits.js [desde] [hasta]`
desde `backend/` (igual que `inspect-gym-activity.js`). Más adelante puede
pasar a una pestaña del Scrum.

**Pendiente de ejecutar una sola vez** (bloqueado para mí por ser un cambio
directo a la base de producción): correr
`node scripts/apply-115-logiclab-events-migration.js` desde `backend/` para
crear la tabla. Sin eso, el contador no rompe nada pero tampoco guarda nada
todavía (el insert falla en silencio).

## 3. Dominio propio (cuando se compre)

Por ahora la web sigue en `https://monraspgit.github.io/frontend-logiclab/`.
Cuando haya dominio (ej. `logiclab.uy`):

1. En el proveedor del dominio, crear un registro DNS tipo `CNAME` que apunte
   el subdominio elegido (ej. `www`) a `monraspgit.github.io`. Si se quiere
   usar el dominio raíz (sin `www`), son registros `A` a las IPs de GitHub
   Pages (185.199.108.153, .109.153, .110.153, .111.153).
2. En GitHub → Settings → Pages del repo, poner ese dominio en "Custom domain".
   GitHub crea un archivo `CNAME` en el repo automáticamente.
3. Esperar la propagación DNS y tildar "Enforce HTTPS" en esa misma pantalla
   (GitHub emite el certificado solo).
4. Actualizar las URLs hardcodeadas de `monraspgit.github.io/frontend-logiclab`
   en `index.html` (canonical, og:url, og:image, JSON-LD) y en `robots.txt`/
   `sitemap.xml` al nuevo dominio.
