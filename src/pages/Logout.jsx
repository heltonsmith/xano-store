// Importamos React y useEffect para ejecutar acciones al montar
import React, { useEffect, useState } from 'react'
// Importamos el hook de autenticación para cerrar sesión
import { useAuth } from '../context/AuthContext.jsx'
// Importamos el componente que muestra el nombre del usuario
import UserBar from '../components/UserBar.jsx'
// Importamos useNavigate para redirigir después de cerrar sesión
import { useNavigate } from 'react-router-dom'

// Componente de la página de cierre de sesión
export default function Logout() {
  // Obtenemos las funciones de logout por Axios y Fetch
  const { logoutAxios, logoutFetch } = useAuth()
  // Estado para mensajes de resultado
  const [msg, setMsg] = useState('')
  // Hook de navegación para redirigir al Home
  const navigate = useNavigate()

  // Al montar, cerramos la sesión automáticamente usando Axios
  useEffect(() => {
    // Función asíncrona interna
    async function run() {
      try {
        // Cerramos sesión vía Axios
        await logoutAxios()
        // Actualizamos mensaje
        setMsg('Sesión cerrada (Axios).')
        // Redirigimos al Home tras cerrar sesión
        navigate('/home')
      } catch (e) {
        // Si hay error, lo mostramos
        setMsg(e?.message || 'Error al cerrar sesión')
      }
    }
    // Ejecutamos la función
    void run()
  }, [])

  // Renderizamos UI con opción de cerrar por Fetch manualmente
  return (
    // Contenedor principal
    <div className="container py-3">
      {/* Barra con el nombre del usuario */}
      <UserBar />
      {/* Título */}
      <h1 className="mb-3">Logout</h1>
      {/* Mensaje de estado */}
      {msg && <div className="alert alert-info">{msg}</div>}
      {/* Botón para ejecutar cierre de sesión con Fetch (demostración visible) */}
      <button className="btn btn-secondary" onClick={async () => { await logoutFetch(); setMsg('Sesión cerrada (Fetch).'); navigate('/home') }}>Cerrar con Fetch</button>
    </div>
  )
}