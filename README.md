# TU RÉPLICA — ¿Con qué jurado FMS coincidís?

Votá el ganador de cada batalla de FMS y descubrí con qué jurado tiene más afinidad tu criterio.

> ⚠️ El sitio es el proyecto de un fan (@watxap) creado con fines didácticos, no hay intención real de completar la base de datos. No está afiliado ni respaldado por Urban Roosters.

---

## ¿De qué se trata?

Esta app carga las batallas de cada temporada de FMS (actualmente registré algunas batallas de la liga Argentina y Méxicana), te permite votar por MC1, MC2 o Réplica en cada enfrentamiento, y al final compara tus votos con los de cada jurado para mostrarte con cuál coincidís.

---

## Funcionalidades

- Selector de liga (FMS Argentina, FMS México)
- Selector de temporada y filtro por fecha/jornada
- Cards de batalla con botones de voto (MC1 / Réplica / MC2)
- Reproducción de videos de YouTube embebidos directamente desde la card
- Modal de resultados con ranking de afinidad por jurado y barras de progreso
- Votos persistentes durante la sesión, separados por liga y temporada

## Algunos detalles UI

- Efecto glitch animado en el título del hero
- Theming de colores dinámico por liga
- Header que se oculta al hacer scroll hacia abajo
- Textura procedural generada con Canvas en las cards
- Cada MC/Jurado cargada su imagen rediseñada para ser visualizada en los botones
- Efecto avatar de jurado al alcanzar el 100% de afinidad (cambia por liga)

---

## Estructura del proyecto

```
/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── js.js
├── data/
│   └── battles.json
└── img/
    ├── [mc-name].webp      ← retratos de los MCs
    ├── [jurado-id].webp    ← fotos de jurados
    └── replica.webp        ← ícono de réplica
```

---

## Cómo correrlo localmente

No requiere ningún framework ni build step. Solo necesitás un servidor local para que el `fetch` del JSON funcione correctamente.

**Con VS Code:**
Instalá la extensión [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) y hacé clic en "Go Live".

**Con Python:**
```bash
# Python 3
python -m http.server 8000
```
Luego abrí `http://localhost:8000` en el navegador.

**Con Node.js:**
```bash
npx serve .
```

---

## Agregar datos

Las batallas, jurados y ligas se configuran en `data/battles.json`. La estructura es:

```json
{
  "ligas": [
    {
      "id": "fms-arg",
      "nombre": "FMS Argentina",
      "abrev": "ARG",
      "pais": "ar",
      "colores": { ... },
      "temporadas": [
        {
          "id": "t7",
          "label": "Temporada 7",
          "jurados": [ { "id": "cno", "name": "CNO", "initials": "CN" } ],
          "jornadas": [ { "id": "j1", "label": "Fecha 1" } ],
          "batallas": [
            {
              "id": "b1",
              "jornada": "j1",
              "mc1": "HDR",
              "mc2": "EXE",
              "youtube": "https://www.youtube.com/watch?v=...",
              "votes": {
                "cno": "mc1"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

Los valores posibles para cada voto de jurado son `"mc1"`, `"mc2"` o `"replica"`.

Para agregar imágenes de MCs, guardá el archivo como `img/[nombre-en-minúsculas].webp` (los espacios se reemplazan por guiones). Si la imagen no existe, simplemente no se muestra.

---

## Tecnologías

- HTML5, CSS3 y JavaScript vanilla (sin dependencias)
- Google Fonts: Bebas Neue + DM Sans
- Flags: [flagcdn.com](https://flagcdn.com)
- Videos: YouTube embed API

---

## Deploy

Al ser un sitio completamente estático, puede hostearse en cualquier servicio:

- **GitHub Pages:** publicá desde la rama `main` en los settings del repositorio
- **Netlify / Vercel:** arrastrá la carpeta o conectá el repo, deploy automático

---

## Licencia

Proyecto de uso libre con fines no comerciales. El contenido de las batallas (videos, nombres de MCs y jurados) pertenece a sus respectivos autores y a Urban Roosters.
