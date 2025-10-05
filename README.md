# Xano Store – Documentación completa para estudiantes

Este repositorio contiene una aplicación React (con Vite) que se integra con un backend de Xano para autenticar usuarios y gestionar productos (listar, crear y subir imágenes). El objetivo de este README es explicar cada archivo, su función y el código línea a línea o bloque a bloque, para que puedas enseñarlo de forma clara a tus estudiantes.

Contenido:
- Visión general y cómo ejecutar el proyecto
- Variables de entorno y configuración
- Estructura de carpetas
- Explicación detallada de cada archivo y su código
  - `index.html`
  - `vite.config.js`
  - `package.json`
  - `src/main.jsx`
  - `src/App.jsx`
  - `src/context/AuthContext.jsx`
  - `src/api/xano.js`
  - `src/components/UserBar.jsx`
  - `src/components/ProductGrid.jsx`
  - `src/components/ProductGridFetch.jsx`
  - `src/components/ProductImagesSlider.jsx`
  - `src/pages/Home.jsx`
  - `src/pages/Login.jsx`
  - `src/pages/Logout.jsx`
  - `src/pages/CreateProduct.jsx`

---

## Cómo ejecutar el proyecto

1. Instala dependencias:
   - `npm install`
2. Configura variables de entorno en `.env` (ver sección siguiente).
3. Arranca el servidor de desarrollo:
   - `npm run dev`
4. Abre el navegador en `http://localhost:5173/`.

---

## Variables de entorno y configuración

Archivo `.env` (en la raíz):

```
VITE_XANO_STORE_BASE=...        # Base de la API para productos
VITE_XANO_AUTH_BASE=...         # Base de la API para autenticación (login/logout)
# Opcional si tu token no incluye exp legible (JWE):
# VITE_XANO_TOKEN_TTL_SEC=86400  # TTL de respaldo en segundos (24h)
```

- Las variables con prefijo `VITE_` son leídas por Vite y disponibles en el código a través de `import.meta.env`.
- Si Xano devuelve un token de tipo JWE (no decodificable en el cliente), usamos un TTL de respaldo para calcular la expiración (más detalles en `AuthContext.jsx`).

---

## Estructura de carpetas

```
├── .env
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── api/
│   │   └── xano.js
│   ├── components/
│   │   ├── ProductGrid.jsx
│   │   ├── ProductGridFetch.jsx
│   │   ├── ProductImagesSlider.jsx
│   │   └── UserBar.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   └── pages/
│       ├── Home.jsx
│       ├── Login.jsx
│       ├── Logout.jsx
│       └── CreateProduct.jsx
```

---

## index.html – Punto de entrada HTML

Código:

```
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>xano-store</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

Explicación:
- `<!doctype html>`: declara el tipo de documento HTML5.
- `<html lang="en">`: idioma del documento.
- `<head>`: metadatos; charset, favicon y viewport.
- `<title>`: título de la pestaña.
- `<div id="root">`: contenedor donde React monta la app.
- `<script type="module" src="/src/main.jsx">`: carga la entrada de React (Vite soporta ES modules).

---

## vite.config.js – Configuración de Vite

Código:

```
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
})
```

Explicación:
- `defineConfig`: ayuda con tipado y autocompletado.
- `@vitejs/plugin-react`: integra React con Vite.
- `babel-plugin-react-compiler`: habilita el compilador de React para optimizaciones de desarrollo.

---

## package.json – Dependencias y scripts

Código (resumen):

```
{
  "name": "xano-store",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.12.2",
    "bootstrap": "^5.3.8",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-router-dom": "^7.9.3"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.0.4",
    "babel-plugin-react-compiler": "^19.1.0-rc.3",
    "eslint": "^9.36.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.22",
    "vite": "^7.1.7"
  }
}
```

Explicación:
- `scripts`: comandos útiles de desarrollo.
- `dependencies`: librerías de runtime (React, Router, Axios, Bootstrap).
- `devDependencies`: herramientas de build y lint.

---

## src/main.jsx – Montaje de la aplicación

Código:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
```

Explicación línea a línea:
- Importa herramientas de React y Router.
- Carga estilos de Bootstrap.
- Envuelve la app con `BrowserRouter` para rutas.
- Envuelve con `AuthProvider` para compartir sesión (token, usuario, expiración).
- Monta `App` dentro de `#root` con `StrictMode` (ayuda a detectar problemas en desarrollo).

---

## src/App.jsx – Contenedor de rutas

Código:

```jsx
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Logout from './pages/Logout.jsx'
import CreateProduct from './pages/CreateProduct.jsx'

export default function App() {
  const { user } = useAuth()
  return (
    <div className="container py-4">
      <nav className="d-flex align-items-center gap-3 mb-4">
        <Link to="/home" className="btn btn-link">Home</Link>
        <Link to="/crear-productos" className="btn btn-link">Crear productos</Link>
        {user ? (
          <Link to="/logout" className="btn btn-link">Logout</Link>
        ) : (
          <Link to="/login" className="btn btn-link">Login</Link>
        )}
        <span className="ms-auto text-muted">{user?.name ? `Conectado: ${user.name}` : 'No conectado'}</span>
      </nav>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/crear-productos" element={<CreateProduct />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </div>
  )
}
```

Explicación:
- Barra de navegación con enlaces y estado de sesión.
- Rutas principales: Home, Login, Logout, Crear productos.
- Redirecciones para ruta raíz y rutas desconocidas.

---

## src/context/AuthContext.jsx – Autenticación y sesión

Responsabilidades:
- Gestiona token, usuario y expiración (`expiresAt`).
- Expone funciones `loginAxios`, `loginFetch`, `logoutAxios`, `logoutFetch` y renovación.
- Lee envs `VITE_XANO_AUTH_BASE` y `VITE_XANO_STORE_BASE`.
- Usa TTL de respaldo si el token no tiene `exp` legible.

Fragmentos clave y explicación:

```jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
const AUTH_BASE = import.meta.env.VITE_XANO_AUTH_BASE
const STORE_BASE = import.meta.env.VITE_XANO_STORE_BASE
const AuthContext = createContext(null)

function decodeJwt(token) {
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const pad = payload.length % 4
    if (pad) payload += '='.repeat(4 - pad)
    const json = atob(payload)
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token') || '')
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('auth_user')
    return raw ? JSON.parse(raw) : null
  })
  const [expiresAt, setExpiresAt] = useState(() => {
    const raw = localStorage.getItem('auth_exp')
    return raw ? Number(raw) : null
  })

  const TOKEN_TTL_SEC = Number(import.meta.env.VITE_XANO_TOKEN_TTL_SEC || '86400')

  useEffect(() => {
    if (!token) {
      localStorage.removeItem('auth_token')
      setExpiresAt(null)
      localStorage.removeItem('auth_exp')
      return
    }
    localStorage.setItem('auth_token', token)
    const payload = decodeJwt(token)
    let expMs = payload?.exp ? payload.exp * 1000 : null
    if (!expMs) expMs = Date.now() + (TOKEN_TTL_SEC * 1000)
    setExpiresAt(expMs)
    localStorage.setItem('auth_exp', String(expMs))
  }, [token])

  useEffect(() => {
    if (user) localStorage.setItem('auth_user', JSON.stringify(user))
    else localStorage.removeItem('auth_user')
  }, [user])

  const makeAuthHeader = (t) => ({ Authorization: `Bearer ${t}` })

  async function loginAxios({ email, password }) {
    const { data } = await axios.post(`${AUTH_BASE}/auth/login`, { email, password })
    const newToken = data?.authToken || data?.token || data?.jwt || ''
    const newUser = data?.user || data?.profile || { name: data?.name || email }
    setToken(newToken)
    setUser(newUser)
    return { token: newToken, user: newUser }
  }

  async function loginFetch({ email, password }) {
    const res = await fetch(`${AUTH_BASE}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
    })
    if (!res.ok) throw new Error(`Login falló: ${res.status}`)
    const data = await res.json()
    const newToken = data?.authToken || data?.token || data?.jwt || ''
    const newUser = data?.user || data?.profile || { name: data?.name || email }
    setToken(newToken)
    setUser(newUser)
    return { token: newToken, user: newUser }
  }

  async function logoutAxios() {
    try { await axios.post(`${AUTH_BASE}/auth/logout`, {}, { headers: makeAuthHeader(token) }) } catch {}
    setToken('')
    setUser(null)
    setExpiresAt(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_exp')
  }

  async function logoutFetch() {
    try { await fetch(`${AUTH_BASE}/auth/logout`, { method: 'POST', headers: makeAuthHeader(token) }) } catch {}
    setToken('')
    setUser(null)
    setExpiresAt(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_exp')
  }

  useEffect(() => {
    if (!expiresAt) return
    const MARGIN_MS = 2 * 60 * 1000
    const remaining = expiresAt - Date.now()
    const delay = Math.max(remaining - MARGIN_MS, 0)
    const id = setTimeout(async () => {
      const ok = window.confirm('Tu sesión está por expirar. ¿Deseas continuar y renovar el token?')
      if (ok) {
        try { await axios.post(`${AUTH_BASE}/auth/refresh_token`, {}, { headers: makeAuthHeader(token) }) }
        catch {
          try { await fetch(`${AUTH_BASE}/auth/refresh_token`, { method: 'POST', headers: makeAuthHeader(token) }) }
          catch (e) {
            alert('No fue posible renovar el token. Se cerrará la sesión.')
            await logoutAxios()
          }
        }
      }
    }, delay)
    return () => clearTimeout(id)
  }, [expiresAt])

  const value = useMemo(() => ({
    token, user, expiresAt,
    setToken, setUser,
    loginAxios, loginFetch,
    logoutAxios, logoutFetch,
  }), [token, user, expiresAt])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
```

Puntos didácticos:
- Persistencia en `localStorage` para sobrevivir reloads.
- Cálculo de expiración con `exp` o TTL de respaldo.
- Separación Axios/Fetch para mostrar dos formas de consumir API.

---

## src/api/xano.js – Cliente de API (Axios)

Funciones:
- `makeAuthHeader(token)`: genera encabezado `Authorization`.
- `createProduct(token, payload)`: POST para crear producto.
- `uploadImages(token, files)`: POST con `FormData` para subir imágenes.
- `attachImagesToProduct(token, id, images)`: PATCH para adjuntar imágenes.
- `listProducts({ token, limit, offset, q })`: GET con paginación y búsqueda.

Detalles clave:
- No forzar `Content-Type` con `FormData`; Axios lo calcula.
- Normaliza respuestas para devolver arrays en uploads y listados.

---

## src/components/UserBar.jsx – Estado del usuario y sesión

Muestra:
- Nombre del usuario.
- Banner de sesión solo si hay usuario y token.
- Expiración (`expiresAt`) y tiempo restante.
- Token con opción mostrar/ocultar.

---

## src/components/ProductGrid.jsx – Listado con Axios

Características:
- Búsqueda local (useMemo).
- Paginación por `offset` y `LIMIT`.
- Muestra tarjetas con slider de imágenes, precio (CLP) y stock.
- Manejo de errores y estado de carga.

---

## src/components/ProductGridFetch.jsx – Listado con Fetch

Similar a `ProductGrid.jsx`, pero usando `fetch` manualmente:
- Construye URL con query params.
- Headers con `Authorization` si hay token.
- Normaliza respuesta a array.
- UI con buscador y paginación.

---

## src/components/ProductImagesSlider.jsx – Slider reusable

Lógica:
- Normaliza `images` a URLs.
- Controles `prev`/`next` con wrap-around.
- Muestra indicadores y botones solo si hay más de una imagen.
- Usa `aspectRatio` vía estilo para mantener proporción.

---

## src/pages/Home.jsx – Página principal

Renderiza:
- `UserBar` para estado de sesión.
- Dos listados: Axios y Fetch, ambos reciben `token` del contexto.

---

## src/pages/Login.jsx – Inicio de sesión

Flujo:
- Formulario controlado (`email`, `password`).
- Botón que llama `loginAxios` (submit) y otro `loginFetch`.
- Navega a `/home` tras éxito.
- Muestra errores en alerta Bootstrap.

---

## src/pages/Logout.jsx – Cierre de sesión

Flujo:
- Al montar, intenta logout con Axios y redirige a `/home`.
- Botón adicional para logout con Fetch.
- Muestra mensaje informativo.

---

## src/pages/CreateProduct.jsx – Crear productos y subir imágenes

Características:
- Requiere `token` para crear.
- Dos rutas: Axios (utilidades de `api/xano.js`) y Fetch (implementación en el componente).
- Subida de imágenes con `FormData` y previsualización.
- Muestra JSON del resultado y miniaturas de imágenes adjuntas.

Bloques clave:
- Estado del formulario y handlers `onChange`, `onFiles`.
- `onSubmit`: orquesta crear, subir y adjuntar (según método).
- Validación y mensajes de error/carga.

---

## Buenas prácticas y notas didácticas

- Contexto de autenticación: centraliza sesión y persistencia.
- Separación de capas: `api/` para llamadas, `components/` para UI, `pages/` para pantallas.
- Manejo de estados: `loading`, `error`, `hasMore`, `offset` para UX clara.
- Búsqueda local: `useMemo` evita recomputaciones innecesarias.
- Uploads: no establecer `Content-Type` manualmente con `FormData`.
- Tokens JWE de Xano: si no tienen `exp` legible, usar TTL de respaldo (ver `.env`).

---

## Troubleshooting

- No aparece tiempo de sesión: verifica `auth_exp` en `localStorage` y `.env` `VITE_XANO_TOKEN_TTL_SEC`.
- Errores 401: revisa que `Authorization: Bearer <token>` se envía y que el token es vigente.
- Subida de imágenes falla: confirma endpoint y que usas `FormData` sin `Content-Type` manual.
- Rutas no cargan: asegúrate de envolver con `<BrowserRouter>` en `main.jsx` y usar `Link`.

---

## Licencia

Este proyecto es educativo y no incluye una licencia específica. Adáptalo según tus necesidades.
