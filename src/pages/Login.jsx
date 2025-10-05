// Importamos React y hooks necesarios para formularios y navegación
import React, { useState } from 'react'
// Importamos el hook de autenticación para ejecutar login por Axios y Fetch
import { useAuth } from '../context/AuthContext.jsx'
// Importamos el componente que muestra el nombre del usuario
import UserBar from '../components/UserBar.jsx'
// Importamos useNavigate para redirigir tras iniciar sesión
import { useNavigate } from 'react-router-dom'

// Componente de la página de inicio de sesión
export default function Login() {
  // Obtenemos funciones de login desde el contexto
  const { loginAxios, loginFetch } = useAuth()
  // Creamos estado local para email y password
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Estado para manejar errores y carga
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  // Hook de navegación para redirigir al usuario
  const navigate = useNavigate()

  // Handler para login usando Axios
  async function onAxios(e) {
    // Prevenimos el submit por defecto si viene de formulario
    e?.preventDefault?.()
    // Limpiamos errores y marcamos carga
    setErr('')
    setLoading(true)
    try {
      // Ejecutamos login con Axios
      await loginAxios({ email, password })
      // Redirigimos al Home tras login exitoso
      navigate('/home')
    } catch (error) {
      // Mostramos mensaje de error
      setErr(error?.response?.data?.message || error.message || 'Error al iniciar sesión (Axios)')
    } finally {
      // Finalizamos la carga
      setLoading(false)
    }
  }

  // Handler para login usando Fetch
  async function onFetch(e) {
    // Prevenimos el submit por defecto
    e?.preventDefault?.()
    // Limpiamos errores y marcamos carga
    setErr('')
    setLoading(true)
    try {
      // Ejecutamos login con Fetch
      await loginFetch({ email, password })
      // Redirigimos al Home tras login exitoso
      navigate('/home')
    } catch (error) {
      // Mostramos mensaje de error
      setErr(error?.message || 'Error al iniciar sesión (Fetch)')
    } finally {
      // Finalizamos la carga
      setLoading(false)
    }
  }

  // Renderizamos la interfaz de login con ambos botones
  return (
    // Contenedor principal con padding
    <div className="container py-3">
      {/* Barra con el nombre del usuario */}
      <UserBar />
      {/* Título de la página */}
      <h1 className="mb-4">Inicio de sesión</h1>
      {/* Formulario de credenciales */}
      <form className="d-grid gap-3" onSubmit={onAxios}>
        {/* Campo de email */}
        <div>
          {/* Etiqueta */}
          <label className="form-label" htmlFor="email">Email</label>
          {/* Input controlado */}
          <input id="email" type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {/* Campo de contraseña */}
        <div>
          {/* Etiqueta */}
          <label className="form-label" htmlFor="password">Contraseña</label>
          {/* Input controlado */}
          <input id="password" type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {/* Botones para login por Axios y Fetch */}
        <div className="d-flex gap-2">
          {/* Botón Axios que usa el submit del formulario */}
          <button className="btn btn-dark" disabled={loading} type="submit">Entrar (Axios)</button>
          {/* Botón Fetch que invoca su propio handler */}
          <button className="btn btn-secondary" disabled={loading} type="button" onClick={onFetch}>Entrar (Fetch)</button>
        </div>
      </form>
      {/* Mostrar error si existe */}
      {err && (
        // Alerta Bootstrap para errores
        <div className="alert alert-danger mt-3">{err}</div>
      )}
    </div>
  )
}