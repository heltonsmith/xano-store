// Importamos React y useState para crear el slider controlado
import React, { useState, useMemo } from 'react'

// Componente de slider de imágenes reutilizable para productos
export default function ProductImagesSlider({ images = [], alt = 'Imagen', aspect = '4/3' }) {
  // Normalizamos el arreglo de imágenes a un arreglo de URLs
  const urls = useMemo(() => {
    // Si images viene como arreglo de objetos, mapeamos a su campo url
    const arr = Array.isArray(images) ? images : []
    // Obtenemos todas las urls válidas
    const list = arr.map((it) => (typeof it === 'string' ? it : it?.url)).filter(Boolean)
    // Si no hay imágenes, usamos un placeholder
    return list.length > 0 ? list : ['https://placehold.co/600x400?text=Sin+imagen']
  }, [images])

  // Estado para el índice actual de la imagen visible
  const [idx, setIdx] = useState(0)

  // Función para ir a la imagen anterior con wrap-around
  function prev() {
    // Calculamos el índice previo con módulo para envolver
    setIdx((i) => (i - 1 + urls.length) % urls.length)
  }

  // Función para ir a la siguiente imagen con wrap-around
  function next() {
    // Calculamos el siguiente índice con módulo para envolver
    setIdx((i) => (i + 1) % urls.length)
  }

  // Render del slider
  return (
    // Contenedor con relación de aspecto fija
    <div className="position-relative bg-light" style={{ aspectRatio: aspect }}>
      {/* Imagen actual ocupando todo el contenedor */}
      <img
        src={urls[idx]}
        alt={alt}
        className="w-100 h-100"
        style={{ objectFit: 'cover' }}
        loading="lazy"
      />
      {/* Botón anterior, visible si hay más de una imagen */}
      {urls.length > 1 && (
        <button
          type="button"
          className="btn btn-sm btn-dark position-absolute"
          onClick={prev}
          style={{ top: '50%', left: '8px', transform: 'translateY(-50%)' }}
          aria-label="Anterior"
        >
          ‹
        </button>
      )}
      {/* Botón siguiente, visible si hay más de una imagen */}
      {urls.length > 1 && (
        <button
          type="button"
          className="btn btn-sm btn-dark position-absolute"
          onClick={next}
          style={{ top: '50%', right: '8px', transform: 'translateY(-50%)' }}
          aria-label="Siguiente"
        >
          ›
        </button>
      )}
      {/* Indicadores de posición (puntos) */}
      {urls.length > 1 && (
        <div className="position-absolute d-flex gap-1" style={{ bottom: '8px', left: '50%', transform: 'translateX(-50%)' }}>
          {urls.map((_, i) => (
            // Punto de indicador de la imagen actual
            <span key={i} className="rounded-circle" style={{ width: 8, height: 8, background: i === idx ? '#000' : '#bbb' }} />
          ))}
        </div>
      )}
    </div>
  )
}