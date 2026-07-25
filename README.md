# RomaCrece

**Analiza. Planifica. Crece.**

RomaCrece es el módulo de crecimiento orgánico de RomaHub/RservasRoma. Está
pensado inicialmente para negocios de belleza que desean auditar su Instagram,
generar ideas de contenido, organizar publicaciones y medir resultados.

## MVP actual

La versión actual utiliza los datos registrados por cada negocio. Incluye:

- Panel principal de crecimiento.
- Auditoría 2.0 de Instagram con puntuación en seis áreas y recomendaciones.
- Análisis y generación de contenido con Gemini.
- Editor de ideas con ganchos, guiones, captions y hashtags.
- Planificador semanal editable.
- Historial de métricas, conversión y oportunidades de mejora.
- Memoria basada en ideas aceptadas o rechazadas, contenido publicado y resultados semanales.
- Calendario con fechas reales y relación entre cada idea, publicación y mejor resultado.
- Diseño adaptable a computadoras y móviles.

Aplicación publicada:
[tusalon.github.io/RomaCrece](https://tusalon.github.io/RomaCrece/)

## Tecnología

- React 19
- Next.js 16
- Vinext y Vite
- TypeScript
- Tailwind CSS 4
- Lucide React

## Ejecutar localmente

Requisitos:

- Node.js `>=22.13.0`
- npm

Instala las dependencias:

```bash
npm install
```

Inicia el entorno de desarrollo:

```bash
npm run dev
```

Para probar exactamente la versión estática de GitHub Pages:

```bash
npm run dev:pages
```

Genera la versión de producción:

```bash
npm run build
```

Genera la publicación de GitHub Pages dentro de `docs/`:

```bash
npm run build:pages
```

El build configura automáticamente la ruta base `/RomaCrece/` y copia el
archivo `.nojekyll`. Los archivos de `docs/assets/` son generados y no deben
editarse manualmente.

## APK Android

RomaCrece también incluye una aplicación Android basada en Capacitor. El logo
de RservasRoma se usa como icono de instalación, icono adaptable y pantalla de
inicio. Para actualizar la carpeta Android localmente:

```bash
npm run android:sync
```

El workflow `.github/workflows/build-android-apk.yml` compila la APK desde
GitHub Actions y publica el artefacto `romacrece-v0.1.0-apk`. La compilación
Android utiliza una salida independiente para no modificar la base URL de
GitHub Pages.

## Preparar Supabase

La aplicación usa el mismo usuario y contraseña de RservasRoma. Una Edge
Function verifica las credenciales y la mensualidad activa, y después crea una
sesión segura de Supabase. Negocios, auditorías, ideas, publicaciones y métricas
se sincronizan por usuario; el almacenamiento local se conserva como respaldo.
La base remota está definida en `supabase/migrations/` con políticas RLS.

1. Crea un proyecto en Supabase.
2. Ejecuta la migración desde el editor SQL o mediante Supabase CLI.
3. Copia `.env.example` como `.env.local`.
4. Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.

La clave `service_role` nunca debe utilizarse en el navegador ni guardarse en
este repositorio.

### Análisis semanal con Gemini

La función `supabase/functions/generate-audit` genera un análisis personalizado
por negocio y semana con `gemini-3.5-flash-lite`. La clave se configura únicamente
como secreto de Edge Functions con el nombre `GEMINI_API_KEY`; nunca se añade a
`.env.local`, al código del navegador ni a GitHub.

La migración `202607240002_ai_audits.sql` guarda el resultado y aplica RLS para
que cada usuario solo pueda leer sus propios análisis. La puntuación calculada
localmente permanece disponible si Gemini no responde o se alcanza el límite.

### Auditoría 2.0

La auditoría comienza sin cifras de demostración y guarda temporalmente el
avance en el dispositivo. Evalúa perfil y biografía, identidad visual,
constancia, calidad y variedad, interacción, y conversión a mensajes y reservas.
Si la usuaria actualiza sus respuestas, Gemini puede renovar el análisis de la
misma semana usando la auditoría más reciente.

### Seguimiento semanal

La sección **Mi semana** permite registrar manualmente los datos principales de
Instagram: seguidores, alcance, visitas al perfil, interacciones, mensajes,
reservas y contenido publicado. La aplicación compara cada registro con la
semana anterior y conserva un historial visual de hasta ocho semanas.

La migración `202607240003_weekly_metrics.sql` crea la tabla
`weekly_metrics`. Sus políticas RLS permiten que cada usuario vea y modifique
únicamente los resultados de sus propios negocios.

### Aprendizaje del contenido

Cada idea puede marcarse como útil o descartarse indicando un motivo sencillo.
Cuando una idea pasa al calendario conserva su relación con la publicación, y
el seguimiento semanal permite señalar cuál funcionó mejor. Gemini recibe estas
señales para reforzar los enfoques útiles y evitar propuestas rechazadas.

La migración `202607250005_content_learning.sql` añade esta memoria sin guardar
contraseñas ni exponer la clave de Gemini en la aplicación.

Para que la confirmación por correo regrese a la aplicación, configura en
**Supabase → Authentication → URL Configuration**:

- **Site URL:** `https://tusalon.github.io/RomaCrece/`
- **Redirect URLs:** `https://tusalon.github.io/RomaCrece/` y `http://localhost:3000/`

## Archivos principales

- `app/page.tsx`: interfaz y comportamiento del prototipo.
- `app/globals.css`: diseño visual y adaptación responsive.
- `app/layout.tsx`: metadatos y estructura general.

## Próxima etapa

Las siguientes mejoras previstas son:

1. Recomendaciones automáticas después de cada semana registrada.
2. Recordatorios locales y notificaciones de publicación.
3. Biblioteca de contenidos ganadores por negocio.
4. Soporte para varios negocios por usuario.
5. Integración posterior con las API oficiales de las redes sociales.

## Seguridad

No deben guardarse contraseñas, tokens, claves privadas ni credenciales de
Supabase dentro del repositorio. Las variables sensibles deben configurarse
fuera del código.

---

Parte del ecosistema **RomaHub / RservasRoma**.
