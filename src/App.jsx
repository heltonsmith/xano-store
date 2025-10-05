// src/App.jsx - Contenedor de rutas de la aplicación
// Este archivo define las rutas: /home, /login, /logout y /crear-productos

// Importamos componentes de React Router para definir el enrutado
import { Routes, Route, Navigate, Link } from 'react-router-dom'
// Importamos el hook de autenticación para conocer usuario y token
import { useAuth } from './context/AuthContext.jsx'
// Importamos las páginas que vamos a mostrar
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Logout from './pages/Logout.jsx'
import CreateProduct from './pages/CreateProduct.jsx'

// Componente principal que renderiza la barra superior y las rutas
export default function App() {
  // Obtenemos el contexto para saber si hay usuario
  const { user } = useAuth() // Leemos usuario actual

  // Renderizamos la estructura de navegación y las rutas
  return (
    // Contenedor general
    <div className="container py-4">
      {/* Barra de navegación simple */}
      <nav className="d-flex align-items-center gap-3 mb-4">
        {/* Enlace a Home */}
        <Link to="/home" className="btn btn-link">Home</Link>
        {/* Enlace a Crear Productos */}
        <Link to="/crear-productos" className="btn btn-link">Crear productos</Link>
        {/* Mostrar Login si NO hay usuario; si hay usuario, mostrar Logout */}
        {user ? (
          <Link to="/logout" className="btn btn-link">Logout</Link>
        ) : (
          <Link to="/login" className="btn btn-link">Login</Link>
        )}
        {/* Nombre del usuario a la derecha */}
        <span className="ms-auto text-muted">{user?.name ? `Conectado: ${user.name}` : 'No conectado'}</span>
      </nav>

      {/* Definición de rutas */}
      <Routes>
        {/* Redirección raíz a /home */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        {/* Página de Home: muestra productos */}
        <Route path="/home" element={<Home />} />
        {/* Página de Login: formulario de inicio de sesión */}
        <Route path="/login" element={<Login />} />
        {/* Página de Logout: cierra la sesión */}
        <Route path="/logout" element={<Logout />} />
        {/* Página de creación de productos: protegida por sesión en el propio componente */}
        <Route path="/crear-productos" element={<CreateProduct />} />
        {/* Ruta comodín: si no existe, redirige a home */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </div>
  )
}
