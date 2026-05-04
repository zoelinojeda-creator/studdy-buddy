# StudyBuddy

Aplicación web escolar de gamificación del estudio, hecha con **HTML, CSS y JavaScript puro**.

## Ejecutar localmente

Solo abre `index.html` en tu navegador.

## Publicar en GitHub Pages

Tienes 2 opciones:

### Opción A (recomendada): con GitHub Actions (ya configurada)

Este repositorio incluye el workflow `.github/workflows/deploy-pages.yml`.

1. Sube el proyecto a GitHub en la rama `main`.
2. En GitHub, ve a **Settings → Pages**.
3. En **Build and deployment**, elige **Source: GitHub Actions**.
4. Haz un push a `main` (o ejecuta manualmente el workflow en **Actions**).
5. Cuando el workflow termine, tu sitio quedará publicado en:
   - `https://TU-USUARIO.github.io/TU-REPO/`

### Opción B: publicar desde branch (sin Actions)

1. Ve a **Settings → Pages**.
2. En **Source**, elige **Deploy from a branch**.
3. Selecciona rama `main` y carpeta `/ (root)`.
4. Guarda los cambios y espera unos minutos.

## Estructura del proyecto

- `index.html`: estructura de la interfaz.
- `styles.css`: estilos responsive.
- `script.js`: lógica de puntos, estados de Mindy y localStorage.
