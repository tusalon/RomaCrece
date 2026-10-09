# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
La dueña de un salón de belleza pequeño: manicurista, estilista, lashista, barbera o peluquera, sola o con un equipo de 1 a 5 personas. Mercados: Cuba, USA, España, México, Guyana y creciendo. Usa un Android de gama media, con internet que va y viene y poco tiempo entre clientas; abre la app con una mano, casi siempre desde el móvil. Ya usa RservasRoma para sus reservas. Publica en Instagram sin una estrategia clara y quiere saber qué hacer esta semana.

El equipo del salón no es usuario de RomaCrece. En el producto, «usuaria» o «dueña» es quien lo usa y «clienta» es la clienta final del salón.

## Product Purpose
RomaCrece es la asesora de crecimiento orgánico en Instagram del ecosistema RservasRoma. Audita la cuenta con los datos que la dueña registra, genera ideas de contenido (ganchos, guiones, captions, hashtags), organiza una semana de publicaciones y mide los resultados hasta la reserva. Éxito: cada semana la dueña sabe cuál es su siguiente paso, lo hace, y ve que su cuenta se acerca a más clientas y reservas reales.

## Positioning
**Una semana, un paso.** Una asesora que con los datos guardados de la dueña le dice tres acciones concretas cada semana, calculadas en el dispositivo sin gastar IA, y que mide el progreso hasta la reserva porque forma parte de RservasRoma. Una herramienta genérica de redes no conoce las reservas del salón.

## Operating Context
- PWA en GitHub Pages (`tusalon.github.io/RomaCrece/`) y APK Android con Capacitor.
- Entra con el mismo usuario y contraseña de RservasRoma; una Edge Function de Supabase verifica la mensualidad activa y crea la sesión.
- Los datos viven en Supabase con RLS por usuaria y se guardan también en el dispositivo como respaldo.
- Gemini genera el análisis semanal y las ideas desde Edge Functions; la clave nunca está en el navegador.
- Las métricas de Instagram las escribe la dueña a mano (no hay conexión con la API de Instagram).
- Contexto de uso: móvil, entre clientas, conexión inestable.

## Capabilities and Constraints
Existe hoy: panel de inicio con asesora semanal de tres pasos, auditoría de Instagram en seis áreas con puntuación, ideas de contenido, planificador semanal (con plan gratuito sin IA), «Mi semana» con registro de resultados y camino hasta la reserva, memoria de ideas aceptadas o descartadas.

Reglas absolutas:
- Nunca prometer resultados.
- Solo crecimiento orgánico: cero publicidad de pago.
- Solo Instagram.
- Si no cumplió, motivar y ajustar el plan; nunca juzgar.
- Tuteo; lenguaje de salón, no de agencia de marketing.
- Ningún precio en la interfaz ni en los textos públicos.
- La clave de Gemini y las claves de servicio nunca están en el navegador ni en el repositorio.

Planeado, aún no construido: módulo de Reels (30 reels listos para grabar, 15 de RservasRoma, 5 de superación, 5 de enseñanza y 5 de finanzas; unos de una persona, que colabora con la cuenta de Instagram de RservasRoma, y otros de 2 a 4 integrantes del grupo). La dueña marca los que quiere hacer y al responsable del producto le llega un aviso con el salón y su WhatsApp para preparar el reel con ella.

Sin decidir: fases de crecimiento 1–5, revisión semanal con día elegido y checklist, notificaciones push, conexión con la API de Instagram, nombre y precio del plan.

Funcionar sin internet es deseable, no obligatorio.

## Brand Commitments
Roma, la pug, es la mascota de RservasRoma y debe estar presente en momentos clave (bienvenida, felicitación, ánimo), no de decoración. Frases de marca: «Esta semana, un paso.», «Tu salón merece crecer.», «Sin adivinar. Con datos.», «Cada semana, más cerca.», «No es suerte. Es plan.» La identidad oficial del ecosistema (logo, iconos, paleta, vector y animación) está en `rservasroma/design/marca/`.

## Evidence on Hand
- Documentos de producto originales: `C:\Users\RODO\Documents\RomaCrece\PRODUCT_CONTEXT.md` y `AGENTS.md`.
- Marca ya producida: logo, iconos, paleta, símbolo en vector y animación en `rservasroma/design/marca/`.
- Informe de crítica y auditoría del 2026-10-09 en `.impeccable/critique/`.
- Ausente, no inventar: testimonios, cifras de crecimiento de salones reales, comparativas con otras herramientas.

## Product Principles
1. Un paso por semana: lo importante primero y lo demás espera.
2. Honestidad con los datos: nada de cifras de demostración ni promesas.
3. La reserva es la meta, no los likes.
4. Pensada para la mano y el tiempo de una dueña de salón, con internet que falla.
5. Acompañar, no juzgar.

## Accessibility & Inclusion
Público con móviles de gama media y poca conexión: texto legible sin zoom, objetivos táctiles cómodos, buen contraste, foco visible y uso con una mano. Respetar la preferencia de poco movimiento sin perder las señales de estado.
