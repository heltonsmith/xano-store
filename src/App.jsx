// src/App.jsx - Componente principal de la aplicación
// Este archivo contiene el formulario para crear productos y mostrar la lista de productos

// Importamos los hooks y componentes necesarios
import { useState } from "react";
// Importamos las funciones de la API de Xano
import { createProduct, uploadImages, attachImagesToProduct } from "./api/xano";
// Importamos los componentes para mostrar productos
import ProductGrid from "./components/ProductGrid";
import ProductGridFetch from "./components/ProductGridFetch";

// Componente principal de la aplicación
export default function App() {
  // Estados para manejar la autenticación, formulario y proceso de creación
  const [token, setToken] = useState("");              // Token de autenticación
  // Estado para el formulario de creación de producto
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    brand: "",
    category: "",
  });
  const [files, setFiles] = useState([]);              // Archivos de imágenes seleccionados
  const [creating, setCreating] = useState(false);     // Indica si está en proceso de creación
  const [result, setResult] = useState(null);          // Resultado de la creación
  const [error, setError] = useState("");              // Mensaje de error

  // Función para actualizar el formulario cuando cambian los inputs
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Función para manejar la selección de archivos
  const onFiles = (e) => {
    const list = Array.from(e.target.files || []);
    setFiles(list);
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Actualizamos estados para mostrar que está creando y limpiar resultados anteriores
    setCreating(true);
    setError("");
    setResult(null);

    try {
      // Verificamos que haya token antes de continuar
      if (!token) throw new Error("Pega el token Bearer primero.");

      // 1) Crear producto con los datos del formulario
      const created = await createProduct(token, {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        brand: form.brand,
        category: form.category,
      });

      // 2) Subir imágenes si se seleccionaron
      let images = [];
      if (files.length > 0) {
        images = await uploadImages(token, files); // Devuelve array con información de las imágenes
      }

      // 3) Adjuntar imágenes al producto si hay
      let updated = created;
      if (images.length > 0) {
        updated = await attachImagesToProduct(token, created.id, images);
      }

      // Guardamos el resultado final (producto con imágenes)
      setResult(updated);
    } catch (err) {
      // Manejamos cualquier error que ocurra
      console.error(err);
      setError(err?.response?.data?.message || err.message || "Error desconocido");
    } finally {
      // Finalizamos el estado de creación
      setCreating(false);
    }
  };

  // Renderizamos la interfaz de la aplicación
  return (
    <div className="container py-5">
      {/* Título y descripción */}
      <h1 className="mb-2">Crear producto + subir imágenes (Xano)</h1>
      <p className="text-muted mt-0">
        Flujo: <strong>POST /product</strong> → <strong>POST /upload/image</strong> → <strong>PATCH /product/:id</strong>
      </p>

      {/* Sección para el token de autenticación */}
      <div className="bg-light p-3 rounded mb-4">
        <label className="fw-bold mb-2 d-block">Token (Bearer)</label>
        <input
          placeholder="pega tu token aquí"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="form-control"
        />
      </div>

      {/* Formulario para crear producto */}
      <form onSubmit={handleSubmit} className="d-grid gap-3">
        {/* Campos del formulario organizados en grid */}
        <div className="row g-3">
          <div className="col-md-6">
            <Field label="Nombre" name="name" value={form.name} onChange={onChange} />
          </div>
          <div className="col-md-6">
            <Field label="Marca" name="brand" value={form.brand} onChange={onChange} />
          </div>
          <div className="col-md-6">
            <Field label="Categoría" name="category" value={form.category} onChange={onChange} />
          </div>
          <div className="col-md-6">
            <Field label="Precio" name="price" type="number" value={form.price} onChange={onChange} />
          </div>
          <div className="col-md-6">
            <Field label="Stock" name="stock" type="number" value={form.stock} onChange={onChange} />
          </div>
          <div className="col-12">
            <Field label="Descripción" name="description" value={form.description} onChange={onChange} textarea />
          </div>
        </div>

        {/* Sección para subir imágenes */}
        <div className="border border-dashed p-3 rounded">
          <label className="fw-bold">Imágenes (puedes seleccionar varias)</label>
          <input type="file" multiple accept="image/*" onChange={onFiles} className="form-control mt-2" />
          {/* Previsualización de imágenes seleccionadas */}
          {files.length > 0 && (
            <div className="d-flex flex-wrap gap-2 mt-3">
              {files.map((f, i) => (
                <img
                  key={i}
                  src={URL.createObjectURL(f)}
                  alt={f.name}
                  className="img-thumbnail"
                  style={{ width: '96px', height: '96px', objectFit: 'cover' }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Botón para enviar el formulario */}
        <button
          disabled={creating}
          className={`btn ${creating ? 'btn-secondary' : 'btn-dark'}`}
        >
          {creating ? "Creando…" : "Crear producto"}
        </button>
      </form>

      {/* Mostrar mensaje de error si existe */}
      {error && (
        <div className="alert alert-danger mt-4">
          {error}
        </div>
      )}

      {/* Mostrar resultado de la creación si existe */}
      {result && (
        <div className="bg-light p-3 rounded mt-4">
          <h3 className="mt-0">Producto creado/actualizado</h3>
          <pre className="m-0">{JSON.stringify(result, null, 2)}</pre>
          {/* Mostrar imágenes del producto creado */}
          {Array.isArray(result.images) && result.images.length > 0 && (
            <div className="d-flex flex-wrap gap-2 mt-3">
              {result.images.map((img, i) => (
                <img 
                  key={i} 
                  src={img.url} 
                  alt={img.name} 
                  className="img-thumbnail"
                  style={{ width: '96px', height: '96px', objectFit: 'cover' }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Línea divisoria */}
      <hr className="border-top my-5" />

      {/* Sección para mostrar la lista de productos usando Axios */}
      <div className="pt-5">
        <ProductGrid token={token} />
      </div>

      {/* Sección para mostrar la lista de productos usando Fetch */}
      <div className="pt-5">
        <ProductGridFetch token={token} />
      </div>
    </div>
  );
}

// Componente auxiliar para los campos del formulario
function Field({ label, name, value, onChange, type = "text", textarea = false }) {
  // Renderizamos un input o textarea según el parámetro
  return (
    <div>
      <label htmlFor={name} className="form-label">{label}</label>
      {textarea ? (
        // Si es textarea, renderizamos un textarea
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className="form-control"
          rows={3}
        />
      ) : (
        // Si no, renderizamos un input normal
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className="form-control"
        />
      )}
    </div>
  );
}
