// Importamos createContext y useState/useEffect para gestionar el estado global de autenticación
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
// Importamos axios para una de las formas de llamar al API
import axios from 'axios'

// Leemos las bases de los endpoints desde variables de entorno
const AUTH_BASE = import.meta.env.VITE_XANO_AUTH_BASE // Base para endpoints de autenticación
const STORE_BASE = import.meta.env.VITE_XANO_STORE_BASE // Base para endpoints de la tienda/productos
// TTL de respaldo para tokens JWE sin 'exp' legible (por defecto 86400s)
const TOKEN_TTL_SEC = Number(import.meta.env.VITE_XANO_TOKEN_TTL_SEC || '86400')

// Creamos el contexto de autenticación
const AuthContext = createContext(null) // Contexto que compartirá usuario, token y acciones

// Función auxiliar para decodificar un JWT y obtener su payload (incluye 'exp' si existe)
function decodeJwt(token) {
  // Si no hay token, devolvemos null
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    // Normalizamos Base64URL y agregamos padding
    let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const pad = payload.length % 4
    if (pad) payload += '='.repeat(4 - pad)
    const json = atob(payload)
    return JSON.parse(json)
  } catch {
    // Si falla la decodificación, devolvemos null
    return null
  }
}

// Proveedor del contexto que envuelve la aplicación
export function AuthProvider({ children }) {
  // Estado para el token JWT
  const [token, setToken] = useState(() => localStorage.getItem('auth_token') || '') // Inicializamos desde localStorage
  // Estado para el usuario (nombre u otros datos)
  const [user, setUser] = useState(() => {
    // Intentamos leer el usuario del almacenamiento
    const raw = localStorage.getItem('auth_user') // Obtenemos cadena guardada
    return raw ? JSON.parse(raw) : null // Parseamos o null si no existe
  })
  // Estado para el instante de expiración del token en milisegundos
  const [expiresAt, setExpiresAt] = useState(() => {
    // Leemos expiración guardada si existe
    const raw = localStorage.getItem('auth_exp') // Obtenemos cadena de tiempo
    return raw ? Number(raw) : null // Convertimos a número o null
  })

  // Efecto: cada vez que cambie el token, actualizamos expiración leyendo el JWT o usando TTL
  useEffect(() => {
    // Si no hay token, limpiamos todo y salimos
    if (!token) {
      localStorage.removeItem('auth_token')
      setExpiresAt(null)
      localStorage.removeItem('auth_exp')
      return
    }

    // Persistimos el token
    localStorage.setItem('auth_token', token)

    // Intentamos decodificar (JWT). Si no hay exp, usamos TTL de respaldo
    const payload = decodeJwt(token)
    let expMs = payload?.exp ? payload.exp * 1000 : null
    if (!expMs) expMs = Date.now() + (TOKEN_TTL_SEC * 1000)

    // Guardamos expiración en estado y almacenamiento
    setExpiresAt(expMs)
    localStorage.setItem('auth_exp', String(expMs))
  }, [token])

  // Efecto: persistimos el usuario cada vez que cambie
  useEffect(() => {
    // Si hay usuario, lo guardamos; si no, removemos
    if (user) localStorage.setItem('auth_user', JSON.stringify(user)) // Guardamos usuario
    else localStorage.removeItem('auth_user') // Eliminamos usuario
  }, [user])

  // Función auxiliar: cabeceras de autorización
  const makeAuthHeader = (t) => ({ Authorization: `Bearer ${t}` }) // Construimos header Bearer

  // Login usando Axios
  async function loginAxios({ email, password }) {
    // Ejecutamos POST al endpoint de login de Xano
    const { data } = await axios.post(`${AUTH_BASE}/auth/login`, { email, password }) // Petición de login
    // Suponemos que la respuesta incluye token y datos del usuario
    const newToken = data?.authToken || data?.token || data?.jwt || '' // Extraemos token
    const newUser = data?.user || data?.profile || { name: data?.name || email } // Extraemos usuario
    // Actualizamos estados
    setToken(newToken) // Guardamos token
    setUser(newUser) // Guardamos usuario
    // Devolvemos datos para uso adicional
    return { token: newToken, user: newUser } // Retornamos resultado
  }

  // Login usando Fetch
  async function loginFetch({ email, password }) {
    // Realizamos POST usando fetch con JSON
    const res = await fetch(`${AUTH_BASE}/auth/login`, {
      method: 'POST', // Método HTTP
      headers: { 'Content-Type': 'application/json' }, // Encabezados
      body: JSON.stringify({ email, password }) // Cuerpo con credenciales
    })
    // Validamos respuesta
    if (!res.ok) throw new Error(`Login falló: ${res.status}`) // Lanzamos error si falla
    // Parseamos JSON
    const data = await res.json() // Obtenemos datos
    // Extraemos token y usuario
    const newToken = data?.authToken || data?.token || data?.jwt || '' // Token obtenido
    const newUser = data?.user || data?.profile || { name: data?.name || email } // Usuario obtenido
    // Actualizamos estado
    setToken(newToken) // Guardamos token
    setUser(newUser) // Guardamos usuario
    // Retornamos resultado
    return { token: newToken, user: newUser } // Devolvemos datos
  }

  // Logout usando Axios
  async function logoutAxios() {
    // Intentamos notificar al backend del cierre de sesión
    try { await axios.post(`${AUTH_BASE}/auth/logout`, {}, { headers: makeAuthHeader(token) }) } catch {}
    // Limpiamos estados y almacenamiento
    setToken('') // Quitamos token
    setUser(null) // Quitamos usuario
    setExpiresAt(null) // Quitamos expiración
    localStorage.removeItem('auth_token') // Borramos token
    localStorage.removeItem('auth_user') // Borramos usuario
    localStorage.removeItem('auth_exp') // Borramos expiración
  }

  // Logout usando Fetch
  async function logoutFetch() {
    // Intentamos notificar al backend con fetch
    try {
      await fetch(`${AUTH_BASE}/auth/logout`, { method: 'POST', headers: makeAuthHeader(token) }) // Petición
    } catch {}
    // Limpiamos estados y almacenamiento
    setToken('') // Quitamos token
    setUser(null) // Quitamos usuario
    setExpiresAt(null) // Quitamos expiración
    localStorage.removeItem('auth_token') // Borramos token
    localStorage.removeItem('auth_user') // Borramos usuario
    localStorage.removeItem('auth_exp') // Borramos expiración
  }

  // Renovación del token usando Axios (endpoint puede variar en Xano)
  async function refreshAxios() {
    // Intentamos pedir un nuevo token al backend
    const { data } = await axios.post(`${AUTH_BASE}/auth/refresh_token`, {}, { headers: makeAuthHeader(token) }) // Petición
    // Extraemos el token renovado
    const newToken = data?.authToken || data?.token || data?.jwt || '' // Nuevo token
    // Actualizamos token en estado
    setToken(newToken) // Guardamos nuevo token
    // Retornamos el token por si se necesita
    return newToken // Devolvemos el nuevo token
  }

  // Renovación del token usando Fetch
  async function refreshFetch() {
    // Realizamos POST para pedir nuevo token
    const res = await fetch(`${AUTH_BASE}/auth/refresh_token`, { method: 'POST', headers: makeAuthHeader(token) }) // Petición
    // Validamos respuesta
    if (!res.ok) throw new Error(`Refresh falló: ${res.status}`) // Error si falla
    // Parseamos JSON
    const data = await res.json() // Datos
    // Extraemos el token renovado
    const newToken = data?.authToken || data?.token || data?.jwt || '' // Nuevo token
    // Actualizamos token
    setToken(newToken) // Guardamos nuevo token
    // Retornamos token
    return newToken // Devolvemos token
  }

  // Efecto: programamos un aviso antes de la expiración del token
  useEffect(() => {
    // Si no hay expiración, no programamos nada
    if (!expiresAt) return // Salimos
    // Calculamos margen de aviso (2 minutos antes de expirar)
    const MARGIN_MS = 2 * 60 * 1000 // Dos minutos
    // Calculamos tiempo restante
    const remaining = expiresAt - Date.now() // Tiempo hasta expirar
    // Si ya está por expirar o vencido, disparamos inmediatamente
    const delay = Math.max(remaining - MARGIN_MS, 0) // Tiempo para el aviso
    // Creamos un temporizador
    const id = setTimeout(async () => {
      // Mostramos confirmación al usuario
      const ok = window.confirm('Tu sesión está por expirar. ¿Deseas continuar y renovar el token?') // Diálogo
      // Si acepta, intentamos renovar
      if (ok) {
        try {
          // Probamos con Axios primero
          await refreshAxios() // Renovamos token
        } catch {
          try {
            // Si falla, probamos con Fetch
            await refreshFetch() // Renovamos token
          } catch (e) {
            // Si sigue fallando, notificamos y cerramos sesión
            alert('No fue posible renovar el token. Se cerrará la sesión.') // Aviso
            await logoutAxios() // Cerramos sesión
          }
        }
      }
    }, delay) // Programamos el aviso
    // Limpiamos el temporizador al cambiar dependencias
    return () => clearTimeout(id) // Cleanup
  }, [expiresAt])

  // Construimos el valor del contexto con memo para evitar renders innecesarios
  const value = useMemo(() => ({
    token, // Token actual
    user, // Usuario actual
    expiresAt, // Momento de expiración
    setToken, // Setter de token (por si se necesita)
    setUser, // Setter de usuario
    loginAxios, // Función de login con Axios
    loginFetch, // Función de login con Fetch
    logoutAxios, // Función de logout con Axios
    logoutFetch, // Función de logout con Fetch
  }), [token, user, expiresAt])

  // Renderizamos el proveedor con el valor calculado
  return (
    // Proveedor del contexto
    <AuthContext.Provider value={value}>
      {/* Contenido de la aplicación envuelta */}
      {children}
    </AuthContext.Provider>
  )
}

// Hook para consumir el contexto de autenticación desde cualquier componente
export function useAuth() {
  // Obtenemos el contexto
  const ctx = useContext(AuthContext) // Leemos el valor de contexto
  // Si no existe, lanzamos un error para ayudar en desarrollo
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>') // Validación
  // Devolvemos el contexto
  return ctx // Valor con token, usuario y acciones
}