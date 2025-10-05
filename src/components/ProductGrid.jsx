// src/components/ProductGrid.jsx - Componente para mostrar productos en una cuadrícula usando Axios
// Este componente muestra una lista de productos con paginación, búsqueda y visualización en tarjetas

// Importamos los hooks necesarios de React y la función para obtener productos de la API
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import ProductImagesSlider from "./ProductImagesSlider.jsx";
import { listProducts } from "../api/xano";

// Creamos un formateador de moneda para mostrar precios en formato CLP (pesos chilenos)
const CLP = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

// Componente principal que recibe el token de autenticación como prop
export default function ProductGrid({ token }) {
  const { user } = useAuth();
  // Estados para manejar los productos y la interfaz
  const [items, setItems] = useState([]); // Lista de productos
  const [loading, setLoading] = useState(false); // Estado de carga
  const [err, setErr] = useState(""); // Mensajes de error
  const [offset, setOffset] = useState(0); // Desplazamiento para paginación
  const [hasMore, setHasMore] = useState(true); // Indica si hay más productos para cargar
  const [q, setQ] = useState(""); // Término de búsqueda

  // Constante para el límite de productos por página
  const LIMIT = 12;

  // Hook de efecto para cargar los productos al montar el componente
  useEffect(() => {
    // Carga inicial de productos
    void fetchPage({ reset: true });
    // Desactivamos la advertencia de dependencias porque solo queremos que se ejecute al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Función asíncrona para cargar una página de productos
  async function fetchPage({ reset = false } = {}) {
    try {
      // Actualizamos el estado para mostrar la carga y limpiar errores previos
      setLoading(true);
      setErr("");
      
      // Calculamos el offset para la siguiente página (0 si es reset)
      const nextOffset = reset ? 0 : offset;
      
      // Llamamos a la API para obtener los productos
      const batch = await listProducts({ token, limit: LIMIT, offset: nextOffset, q });
      
      // Determinamos si hay más productos disponibles
      setHasMore(batch.length === LIMIT); // Si trae menos que el límite, no hay más
      
      // Actualizamos el offset para la próxima carga
      setOffset(nextOffset + batch.length);
      
      // Actualizamos la lista de productos (reemplazando o añadiendo según reset)
      setItems((old) => (reset ? batch : [...old, ...batch]));
    } catch (e) {
      // Manejamos cualquier error que ocurra durante la carga
      console.error(e);
      setErr(e?.response?.data?.message || e.message || "Error al cargar productos");
    } finally {
      // Finalizamos el estado de carga independientemente del resultado
      setLoading(false);
    }
  }

  // Filtramos los productos según el término de búsqueda (búsqueda local)
  // useMemo optimiza el rendimiento recalculando solo cuando items o q cambian
  const filtered = useMemo(() => {
    // Preparamos el término de búsqueda eliminando espacios y convirtiendo a minúsculas
    const needle = q.trim().toLowerCase();
    
    // Si no hay término de búsqueda, devolvemos todos los productos
    if (!needle) return items;
    
    // Filtramos los productos que coincidan con el término en cualquier campo relevante
    return items.filter((p) =>
      [p.name, p.brand, p.category, p.description].some((f) =>
        String(f || "").toLowerCase().includes(needle)
      )
    );
  }, [items, q]);

  // Renderizamos la interfaz del componente
  return (
    <div className="container">
      {/* Cabecera con título, buscador y botón de recarga */}
      <div className="d-flex align-items-center mb-3 gap-3">
        <h2 className="m-0 flex-grow-1">Productos (Axios)</h2>
        <span className="small text-muted">Usuario: {user?.name || 'No conectado'}</span>
        {/* Campo de búsqueda */}
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

      {/* Mostrar mensaje de error si existe */}
      {err && (
        <div className="alert alert-danger mb-3">
          {err}
        </div>
      )}

      {/* Cuadrícula de productos con responsive para diferentes tamaños de pantalla */}
      <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
        {/* Iteramos sobre los productos filtrados y renderizamos una tarjeta para cada uno */}
        {filtered.map((p) => (
          <div className="col" key={p.id}>
            <Card product={p} />
          </div>
        ))}
      </div>

      {/* Sección de paginación o mensaje de fin de lista */}
      <div className="d-flex justify-content-center my-4">
        {hasMore ? (
          // Botón para cargar más productos si hay disponibles
          <button
            onClick={() => fetchPage({ reset: false })}
            disabled={loading}
            className="btn btn-dark"
          >
            {loading ? "Cargando…" : "Cargar más"}
          </button>
        ) : (
          // Mensaje cuando no hay más productos para cargar
          <span className="text-muted">{loading ? "Cargando…" : "No hay más productos"}</span>
        )}
      </div>
    </div>
  );
}

// Componente Card para mostrar la información de un producto individual
function Card({ product }) {
  // Renderizamos la tarjeta del producto
  return (
    <div className="card h-100">
      {/* Slider de imágenes mostrando todas las imágenes del producto */}
      <ProductImagesSlider images={product.images} alt={product.name} aspect={'4/3'} />
      {/* Cuerpo de la tarjeta con información del producto */}
      <div className="card-body">
        {/* Nombre del producto */}
        <h5 className="card-title fw-bold mb-1">{product.name}</h5>
        {/* Marca y categoría */}
        <div className="small text-muted mb-2">
          {product.brand ? `${product.brand} • ` : ""}{product.category || ""}
        </div>
        {/* Precio y estado de stock */}
        <div className="d-flex justify-content-between align-items-center">
          {/* Precio formateado en CLP */}
          <div className="fw-bold">{CLP.format(Number(product.price || 0))}</div>
          {/* Indicador de stock con color según disponibilidad */}
          <span className={`small ${product.stock > 0 ? 'text-success' : 'text-danger'}`}>
            {product.stock > 0 ? `Stock: ${product.stock}` : "Sin stock"}
          </span>
        </div>
      </div>
    </div>
  );
}
