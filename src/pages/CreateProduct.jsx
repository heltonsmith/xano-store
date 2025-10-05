// Importamos React y hooks necesarios para formularios y estado
import React, { useState } from 'react'
// Importamos el hook de autenticación para obtener token y usuario
import { useAuth } from '../context/AuthContext.jsx'
// Importamos el componente que muestra el nombre del usuario
import UserBar from '../components/UserBar.jsx'
// Importamos funciones de API existentes para el flujo con Axios
import { createProduct, uploadImages, attachImagesToProduct } from '../api/xano.js'

// Componente de la página de creación de productos
export default function CreateProduct() {
  // Obtenemos token y usuario del contexto
  const { token, user } = useAuth()
  // Estado del formulario de producto
  const [form, setForm] = useState({ name: '', description: '', price: 0, stock: 0, brand: '', category: '' })
  // Estado para archivos de imágenes seleccionados
  const [files, setFiles] = useState([])
  // Estado para mostrar errores
  const [error, setError] = useState('')
  // Estado para mostrar resultado del producto creado
  const [result, setResult] = useState(null)
  // Estado de carga durante la creación
  const [creating, setCreating] = useState(false)
  // Estado para seleccionar el método (axios o fetch)
  const [method, setMethod] = useState('axios')
  // Leemos la base de la API desde variables de entorno (para el modo fetch)
  const STORE_BASE = import.meta.env.VITE_XANO_STORE_BASE

  // Handler para cambios en inputs del formulario
  function onChange(e) {
    // Actualizamos el estado del formulario usando el nombre del campo como clave
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Handler para selección de archivos
  function onFiles(e) {
    // Convertimos FileList a array para manejarlo más fácilmente
    const list = Array.from(e.target.files || [])
    // Guardamos archivos seleccionados
    setFiles(list)
  }

  // Función auxiliar para crear producto usando Fetch
  async function createWithFetch() {
    // Construimos headers incluyendo autorización
    const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    // Realizamos POST al endpoint de creación de producto
    const res = await fetch(`${STORE_BASE}/product`, { method: 'POST', headers, body: JSON.stringify({
      // Enviamos campos del formulario con conversiones necesarias
      name: form.name,
      description: form.description,
      price: Number(form.price),
      stock: Number(form.stock),
      brand: form.brand,
      category: form.category,
    }) })
    // Validamos la respuesta
    if (!res.ok) throw new Error(`Error al crear producto: ${res.status}`)
    // Parseamos la respuesta
    const created = await res.json()
    // Si hay archivos, subimos imágenes
    let images = []
    if (files.length > 0) {
      // Creamos FormData para subir archivos
      const fd = new FormData()
      // Añadimos cada archivo bajo la clave content[] como espera Xano
      for (const f of files) fd.append('content[]', f)
      // Realizamos POST al endpoint de upload
      const upRes = await fetch(`${STORE_BASE}/upload/image`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
      // Validamos la respuesta del upload
      if (!upRes.ok) throw new Error(`Error al subir imágenes: ${upRes.status}`)
      // Parseamos y normalizamos a array
      const upData = await upRes.json()
      images = Array.isArray(upData) ? upData : (upData.files || [])
    }
    // Si hay imágenes, las adjuntamos al producto
    let final = created
    if (images.length > 0) {
      // Hacemos PATCH para adjuntar
      const patchRes = await fetch(`${STORE_BASE}/product/${created.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ images }) })
      // Validamos respuesta
      if (!patchRes.ok) throw new Error(`Error al adjuntar imágenes: ${patchRes.status}`)
      // Parseamos el producto final
      final = await patchRes.json()
    }
    // Devolvemos el resultado final
    return final
  }

  // Handler del submit del formulario de creación
  async function onSubmit(e) {
    // Prevenimos comportamiento por defecto
    e.preventDefault()
    // Limpiamos errores y marcamos carga
    setError('')
    setCreating(true)
    setResult(null)
    try {
      // Si no hay token, impedimos crear y lanzamos error
      if (!token) throw new Error('Debes iniciar sesión para crear productos.')
      // Ejecución según método seleccionado
      const updated = method === 'axios'
        // Flujo Axios: crear, subir, adjuntar usando utilidades existentes
        ? await (async () => {
            // Creamos el producto
            const created = await createProduct(token, {
              name: form.name,
              description: form.description,
              price: Number(form.price),
              stock: Number(form.stock),
              brand: form.brand,
              category: form.category,
            })
            // Subimos imágenes si hay
            const images = files.length > 0 ? await uploadImages(token, files) : []
            // Adjuntamos si corresponde
            return images.length > 0 ? await attachImagesToProduct(token, created.id, images) : created
          })()
        // Flujo Fetch: alternativa visible
        : await createWithFetch()
      // Guardamos el resultado
      setResult(updated)
    } catch (err) {
      // Mostramos el error amigable
      setError(err?.response?.data?.message || err.message || 'Error desconocido')
    } finally {
      // Quitamos estado de carga
      setCreating(false)
    }
  }

  // Renderizamos la UI de creación de productos
  return (
    // Contenedor principal con padding
    <div className="container py-3">
      {/* Barra con el nombre del usuario */}
      <UserBar />
      {/* Título de la página */}
      <h1 className="mb-2">Crear productos</h1>
      {/* Nota de restricción por sesión */}
      {!token && (
        // Alerta que impide creación sin sesión
        <div className="alert alert-warning">No puedes crear productos sin iniciar sesión.</div>
      )}
      {/* Selector de método (Axios o Fetch) */}
      <div className="mb-3 d-flex align-items-center gap-3">
        {/* Etiqueta */}
        <span className="fw-bold">Método:</span>
        {/* Radio para Axios */}
        <label className="form-check form-check-inline">
          {/* Input tipo radio */}
          <input className="form-check-input" type="radio" name="method" value="axios" checked={method === 'axios'} onChange={() => setMethod('axios')} />
          {/* Texto */}
          <span className="form-check-label">Axios</span>
        </label>
        {/* Radio para Fetch */}
        <label className="form-check form-check-inline">
          {/* Input tipo radio */}
          <input className="form-check-input" type="radio" name="method" value="fetch" checked={method === 'fetch'} onChange={() => setMethod('fetch')} />
          {/* Texto */}
          <span className="form-check-label">Fetch</span>
        </label>
      </div>
      {/* Formulario de creación */}
      <form className="d-grid gap-3" onSubmit={onSubmit}>
        {/* Fila de inputs con grid */}
        <div className="row g-3">
          {/* Campo nombre */}
          <div className="col-md-6">
            {/* Etiqueta e input controlado */}
            <label className="form-label" htmlFor="name">Nombre</label>
            {/* Input */}
            <input id="name" name="name" className="form-control" value={form.name} onChange={onChange} />
          </div>
          {/* Campo marca */}
          <div className="col-md-6">
            {/* Etiqueta */}
            <label className="form-label" htmlFor="brand">Marca</label>
            {/* Input */}
            <input id="brand" name="brand" className="form-control" value={form.brand} onChange={onChange} />
          </div>
          {/* Campo categoría */}
          <div className="col-md-6">
            {/* Etiqueta */}
            <label className="form-label" htmlFor="category">Categoría</label>
            {/* Input */}
            <input id="category" name="category" className="form-control" value={form.category} onChange={onChange} />
          </div>
          {/* Campo precio */}
          <div className="col-md-6">
            {/* Etiqueta */}
            <label className="form-label" htmlFor="price">Precio</label>
            {/* Input numérico */}
            <input id="price" type="number" name="price" className="form-control" value={form.price} onChange={onChange} />
          </div>
          {/* Campo stock */}
          <div className="col-md-6">
            {/* Etiqueta */}
            <label className="form-label" htmlFor="stock">Stock</label>
            {/* Input numérico */}
            <input id="stock" type="number" name="stock" className="form-control" value={form.stock} onChange={onChange} />
          </div>
          {/* Campo descripción */}
          <div className="col-12">
            {/* Etiqueta */}
            <label className="form-label" htmlFor="description">Descripción</label>
            {/* Textarea */}
            <textarea id="description" name="description" rows={3} className="form-control" value={form.description} onChange={onChange} />
          </div>
        </div>
        {/* Sección de subida de imágenes */}
        <div className="border border-dashed p-3 rounded">
          {/* Etiqueta */}
          <label className="fw-bold">Imágenes (puedes seleccionar varias)</label>
          {/* Input de archivos múltiples */}
          <input type="file" multiple accept="image/*" onChange={onFiles} className="form-control mt-2" />
          {/* Previsualización */}
          {files.length > 0 && (
            // Contenedor de imágenes seleccionadas
            <div className="d-flex flex-wrap gap-2 mt-3">
              {/* Mapeo de archivos a imágenes */}
              {files.map((f, i) => (
                // Imagen con miniatura
                <img key={i} src={URL.createObjectURL(f)} alt={f.name} className="img-thumbnail" style={{ width: '96px', height: '96px', objectFit: 'cover' }} />
              ))}
            </div>
          )}
        </div>
        {/* Botón de envío */}
        <button disabled={creating || !token} className={`btn ${creating ? 'btn-secondary' : 'btn-dark'}`}>
          {/* Texto del botón */}
          {creating ? 'Creando…' : `Crear producto (${method})`}
        </button>
      </form>
      {/* Error si existe */}
      {error && (
        // Alerta de error
        <div className="alert alert-danger mt-4">{error}</div>
      )}
      {/* Resultado si existe */}
      {result && (
        // Contenedor con detalles del resultado
        <div className="bg-light p-3 rounded mt-4">
          {/* Título */}
          <h3 className="mt-0">Producto creado/actualizado</h3>
          {/* JSON del resultado */}
          <pre className="m-0">{JSON.stringify(result, null, 2)}</pre>
          {/* Imágenes del producto si existen */}
          {Array.isArray(result.images) && result.images.length > 0 && (
            // Contenedor de imágenes del resultado
            <div className="d-flex flex-wrap gap-2 mt-3">
              {/* Mapeo de imágenes a miniaturas */}
              {result.images.map((img, i) => (
                // Imagen con miniatura
                <img key={i} src={img.url} alt={img.name} className="img-thumbnail" style={{ width: '96px', height: '96px', objectFit: 'cover' }} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}