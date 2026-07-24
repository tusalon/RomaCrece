# RomaCrece

**Analiza. Planifica. Crece.**

RomaCrece es el módulo de crecimiento orgánico de RomaHub/RservasRoma. Está
pensado inicialmente para negocios de belleza que desean auditar su Instagram,
generar ideas de contenido, organizar publicaciones y medir resultados.

## Prototipo actual

La versión actual es un prototipo visual e interactivo con datos de
demostración. Incluye:

- Panel principal de crecimiento.
- Auditoría de Instagram con puntuación y recomendaciones.
- Generador y editor de ideas de contenido.
- Planificador semanal.
- Métricas, conversión y oportunidades de mejora.
- Diseño adaptable a computadoras y móviles.

Prototipo publicado:
[romacrece.leetomy437.chatgpt.site](https://romacrece.leetomy437.chatgpt.site)

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

La aplicación usa Supabase Auth con correo y contraseña. Negocios, auditorías,
ideas y publicaciones planificadas se sincronizan por usuario; el almacenamiento
local se conserva únicamente como respaldo. La base remota está definida en
`supabase/migrations/202607230001_initial_schema.sql` con políticas RLS.

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

### Seguimiento semanal

La sección **Mi semana** permite registrar manualmente los datos principales de
Instagram: seguidores, alcance, visitas al perfil, interacciones, mensajes,
reservas y contenido publicado. La aplicación compara cada registro con la
semana anterior y conserva un historial visual de hasta ocho semanas.

La migración `202607240003_weekly_metrics.sql` crea la tabla
`weekly_metrics`. Sus políticas RLS permiten que cada usuario vea y modifique
únicamente los resultados de sus propios negocios.

Para que la confirmación por correo regrese a la aplicación, configura en
**Supabase → Authentication → URL Configuration**:

- **Site URL:** `https://tusalon.github.io/RomaCrece/`
- **Redirect URLs:** `https://tusalon.github.io/RomaCrece/` y `http://localhost:3000/`

## Archivos principales

- `app/page.tsx`: interfaz y comportamiento del prototipo.
- `app/globals.css`: diseño visual y adaptación responsive.
- `app/layout.tsx`: metadatos y estructura general.

## Próxima etapa

El siguiente MVP deberá incorporar:

1. Recuperación de contraseña y administración de cuenta.
2. Soporte para varios negocios por usuario.
3. Generación de contenido mediante una función segura del servidor.
4. Integración posterior con las API oficiales de las redes sociales.

## Seguridad

No deben guardarse contraseñas, tokens, claves privadas ni credenciales de
Supabase dentro del repositorio. Las variables sensibles deben configurarse
fuera del código.

---

Parte del ecosistema **RomaHub / RservasRoma**.
