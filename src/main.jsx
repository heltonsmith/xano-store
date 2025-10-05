// Importamos StrictMode desde React para destacar posibles problemas en desarrollo
import { StrictMode } from 'react'
// Importamos createRoot para montar la aplicación en el DOM
import { createRoot } from 'react-dom/client'
// Importamos los estilos de Bootstrap para una UI rápida
import 'bootstrap/dist/css/bootstrap.min.css'
// Importamos BrowserRouter para habilitar el enrutado de la aplicación
import { BrowserRouter } from 'react-router-dom'
// Importamos el proveedor de autenticación que gestionará token y usuario
import { AuthProvider } from './context/AuthContext.jsx'
// Importamos el componente principal que ahora contendrá las rutas
import App from './App.jsx'

// Montamos la aplicación en el elemento con id="root"
createRoot(document.getElementById('root')).render(
  // Activamos StrictMode para advertencias en desarrollo
  <StrictMode>
    {/* Envolvemos con BrowserRouter para habilitar rutas */}
    <BrowserRouter>
      {/* Envolvemos con AuthProvider para compartir sesión y token */}
      <AuthProvider>
        {/* Renderizamos el componente principal (definirá las rutas) */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
