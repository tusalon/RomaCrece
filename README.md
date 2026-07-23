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

## Archivos principales

- `app/page.tsx`: interfaz y comportamiento del prototipo.
- `app/globals.css`: diseño visual y adaptación responsive.
- `app/layout.tsx`: metadatos y estructura general.

## Próxima etapa

El siguiente MVP deberá incorporar:

1. Supabase Auth y políticas RLS seguras.
2. Aislamiento multinegocio mediante `negocio_id`.
3. Onboarding de negocios.
4. Registro manual de métricas.
5. Generación de contenido mediante una función segura del servidor.
6. Integración posterior con las API oficiales de las redes sociales.

## Seguridad

No deben guardarse contraseñas, tokens, claves privadas ni credenciales de
Supabase dentro del repositorio. Las variables sensibles deben configurarse
fuera del código.

---

Parte del ecosistema **RomaHub / RservasRoma**.
