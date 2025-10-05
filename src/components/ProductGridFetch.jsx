// src/components/ProductGridFetch.jsx
// Importamos los hooks necesarios de React
import { useEffect, useMemo, useState } from "react";

// Creamos un formateador de moneda para mostrar precios en formato CLP (pesos chilenos)
// sin decimales y con el símbolo de la moneda
const CLP = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

// Componente principal que muestra una cuadrícula de productos
// Recibe el token de autenticación como prop
export default function ProductGridFetch({ token }) {
  // Estado para almacenar la lista de productos
  const [items, setItems] = useState([]);
  // Estado para controlar cuando está cargando datos
  const [loading, setLoading] = useState(false);
  // Estado para almacenar mensajes de error
  const [err, setErr] = useState("");
  // Estado para controlar la paginación (desde qué índice cargar)
  const [offset, setOffset] = useState(0);
  // Estado para saber si hay más productos por cargar
  const [hasMore, setHasMore] = useState(true);
  // Estado para almacenar el texto de búsqueda
  const [q, setQ] = useState("");

  // Constante para definir cuántos productos cargar por página
  const LIMIT = 12;
  // Obtenemos la URL base de la API desde las variables de entorno
  const STORE_BASE = import.meta.env.VITE_XANO_STORE_BASE;

  // Hook que se ejecuta al montar el componente para cargar los productos iniciales
  useEffect(() => {
    // Cargamos la primera página de productos al iniciar
    void fetchPage({ reset: true });
    // Desactivamos la regla de exhaustive-deps porque no necesitamos que se ejecute cuando cambian otras dependencias
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Función asíncrona para cargar una página de productos
  async function fetchPage({ reset = false } = {}) {
    try {
      // Indicamos que está cargando y limpiamos errores anteriores
      setLoading(true);
      setErr("");
      // Calculamos el offset: si es reset, empezamos desde 0, si no, usamos el offset actual
      const nextOffset = reset ? 0 : offset;
      
      // Construimos la URL con los parámetros de paginación y búsqueda
      const url = new URL(`${STORE_BASE}/product`);
      url.searchParams.append('limit', LIMIT);
      url.searchParams.append('offset', nextOffset);
      // Solo añadimos el parámetro de búsqueda si hay texto
      if (q) url.searchParams.append('q', q);
      
      // Configuramos los headers de autenticación si hay token
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      // Realizamos la petición HTTP usando fetch (en lugar de axios)
      const response = await fetch(url, { headers });
      
      // Verificamos si la respuesta es correcta
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      // Convertimos la respuesta a JSON
      const data = await response.json();
      // Normalizamos la respuesta: puede ser un array directo o estar dentro de data.items
      const batch = Array.isArray(data) ? data : (data?.items ?? []);
      
      // Si recibimos menos productos que el límite, significa que no hay más
      setHasMore(batch.length === LIMIT);
      // Actualizamos el offset para la próxima carga
      setOffset(nextOffset + batch.length);
      // Actualizamos la lista de productos: si es reset, reemplazamos; si no, añadimos
      setItems((old) => (reset ? batch : [...old, ...batch]));
    } catch (e) {
      // Mostramos el error en consola y lo guardamos en el estado
      console.error(e);
      setErr(e.message || "Error al cargar productos");
    } finally {
      // Siempre indicamos que terminó de cargar, haya error o no
      setLoading(false);
    }
  }

  // Usamos useMemo para filtrar los productos según el texto de búsqueda
  // Solo se recalcula cuando cambian los items o el texto de búsqueda
  const filtered = useMemo(() => {
    // Normalizamos el texto de búsqueda
    const needle = q.trim().toLowerCase();
    // Si no hay texto, devolvemos todos los productos
    if (!needle) return items;
    // Filtramos los productos que coincidan con el texto en alguno de sus campos
    return items.filter((p) =>
      [p.name, p.brand, p.category, p.description].some((f) =>
        // Convertimos el campo a string y buscamos el texto
        String(f || "").toLowerCase().includes(needle)
      )
    );
  }, [items, q]);

  // Renderizamos el componente
  return (
    // Contenedor principal con estilos
    <div className="container">
      {/* Barra superior con título, buscador y botón de recarga */}
      <div className="d-flex align-items-center mb-3 gap-3">
        <h2 className="m-0 flex-grow-1">Productos (con Fetch)</h2>
        {/* Input para búsqueda */}
        <input
          placeholder="Buscar por nombre, marca, categoría…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="form-control"
          style={{ width: '320px' }}
        />
        {/* Botón para recargar productos */}
        <button
          onClick={() => fetchPage({ reset: true })}
          disabled={loading}
          title="Actualizar desde servidor"
          className="btn btn-outline-secondary"
        >
          Recargar
        </button>
      </div>

      {/* Mostramos mensaje de error si existe */}
      {err && (
        <div className="alert alert-danger mb-3">
          {err}
        </div>
      )}

      {/* Cuadrícula de productos */}
      <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
        {/* Renderizamos cada producto usando el componente Card */}
        {filtered.map((p) => (
          <div className="col" key={p.id}>
            <Card product={p} />
          </div>
        ))}
      </div>

      {/* Sección inferior con botón para cargar más o mensaje de fin */}
      <div className="d-flex justify-content-center my-4">
        {hasMore ? (
          // Si hay más productos, mostramos botón para cargar más
          <button
            onClick={() => fetchPage({ reset: false })}
            disabled={loading}
            className="btn btn-dark"
          >
            {loading ? "Cargando…" : "Cargar más"}
          </button>
        ) : (
          // Si no hay más productos, mostramos mensaje
          <span className="text-muted">{loading ? "Cargando…" : "No hay más productos"}</span>
        )}
      </div>
    </div>
  );
}

// Componente Card para mostrar cada producto individual
function Card({ product: p }) {
  // Obtenemos la URL de la primera imagen del producto, si existe
  const mainImage = Array.isArray(p.images) && p.images[0]?.url;

  return (
    // Contenedor de la tarjeta con estilos y efectos al pasar el ratón
    <div
      className="card h-100"
      // Efecto de elevación al pasar el ratón
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 24px -12px rgba(0,0,0,0.15)";
      }}
      // Restaurar al salir el ratón
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      {/* Contenedor para la imagen del producto */}
      <div className="bg-light position-relative" style={{ aspectRatio: "1/1" }}>
        {mainImage ? (
          // Si hay imagen, la mostramos
          <img
            src={mainImage}
            alt={p.name}
            className="w-100 h-100"
            style={{ objectFit: "cover" }}
          />
        ) : (
          // Si no hay imagen, mostramos un placeholder
          <div
            className="position-absolute d-flex align-items-center justify-content-center text-muted"
            style={{ inset: 0 }}
          >
            Sin imagen
          </div>
        )}
      </div>

      {/* Información del producto */}
      <div className="card-body">
        {/* Marca y categoría */}
        <div className="small text-muted mb-1">
          {/* Filtramos valores nulos y unimos con punto */}
          {[p.brand, p.category].filter(Boolean).join(" · ")}
        </div>
        {/* Nombre del producto */}
        <h5 className="card-title mb-2">{p.name}</h5>
        {/* Precio formateado */}
        <div className="fw-bold fs-5">{CLP.format(p.price)}</div>
        {/* Disponibilidad con color según stock */}
        <div className={`small mt-1 ${p.stock > 0 ? 'text-success' : 'text-danger'}`}>
          {p.stock > 0 ? `${p.stock} disponibles` : "Agotado"}
        </div>
      </div>
    </div>
  );
}