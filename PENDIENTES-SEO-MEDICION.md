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

## 2. GoatCounter — contador de visitas (gratis, sin cookies)

1. Entrar a https://www.goatcounter.com/ y crear cuenta.
2. Elegir un código de sitio (ej. `logiclab`) → queda en `logiclab.goatcounter.com`.
3. Pasar ese código: en `index.html` reemplazar `MYCODE` por el código elegido,
   en la línea `data-goatcounter="https://MYCODE.goatcounter.com/count"`.

Ya queda contando automáticamente: visitas, de dónde vienen (`?src=...`),
clics en cada botón de WhatsApp (por sección), "Ver video" por rubro,
apertura del cotizador y "enviar presupuesto" por rubro/plan.

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
