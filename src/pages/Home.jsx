// Importamos React para definir el componente
import React from 'react'
// Importamos el componente que muestra el nombre del usuario
import UserBar from '../components/UserBar.jsx'
// Importamos los componentes de cuadrícula de productos (Axios y Fetch)
import ProductGrid from '../components/ProductGrid.jsx'
import ProductGridFetch from '../components/ProductGridFetch.jsx'
// Importamos el hook de autenticación para obtener el token
import { useAuth } from '../context/AuthContext.jsx'

// Componente de la página Home donde se muestran los productos registrados
export default function Home() {
  // Obtenemos token desde el contexto de autenticación
  const { token } = useAuth()
  // Renderizamos la página con ambas cuadrículas (Axios y Fetch)
  return (
    // Contenedor principal con padding
    <div className="container py-3">
      {/* Barra con el nombre del usuario */}
      <UserBar />
      {/* Título de la página */}
      <h1 className="mb-4">Productos (Home)</h1>
      {/* Sección usando Axios */}
      <section className="mb-5">
        {/* Subtítulo para Axios */}
        <h2 className="h4">Listado con Axios</h2>
        {/* Componente de cuadrícula que usa Axios */}
        <ProductGrid token={token} />
      </section>
      {/* Sección usando Fetch */}
      <section>
        {/* Subtítulo para Fetch */}
        <h2 className="h4">Listado con Fetch</h2>
        {/* Componente de cuadrícula que usa Fetch */}
        <ProductGridFetch token={token} />
      </section>
    </div>
  )
}