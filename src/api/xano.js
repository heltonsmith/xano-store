// src/api/xano.js - Módulo para interactuar con la API de Xano
// Este archivo contiene todas las funciones necesarias para comunicarse con el backend de Xano

// Importamos axios, una biblioteca popular para realizar peticiones HTTP
import axios from "axios";

// Obtenemos la URL base de la API desde las variables de entorno
// Esto permite cambiar la URL sin modificar el código (desarrollo, producción, etc.)
const STORE_BASE = import.meta.env.VITE_XANO_STORE_BASE;
// Si vas a iniciar sesión desde aquí, usa también AUTH_BASE.

// Función auxiliar para crear el encabezado de autorización con el token JWT
// Recibe el token y devuelve un objeto con el formato requerido por la API
export const makeAuthHeader = (token) => ({
  Authorization: `Bearer ${token}`, // Formato estándar para autenticación JWT
});

// 1) Función para crear un nuevo producto (sin imágenes inicialmente)
// Parámetros:
// - token: JWT para autenticación
// - payload: objeto con los datos del producto (nombre, precio, etc.)
export async function createProduct(token, payload) {
  // Realizamos una petición POST con axios y esperamos la respuesta
  // Usamos desestructuración para obtener directamente el campo 'data' de la respuesta
  const { data } = await axios.post(
    `${STORE_BASE}/product`, // URL del endpoint para crear productos
    payload, // Datos del producto en formato JSON
    { 
      headers: { 
        ...makeAuthHeader(token), // Incluimos el token de autenticación
        "Content-Type": "application/json" // Especificamos que enviamos JSON
      } 
    }
  );
  return data; // Devolvemos los datos de la respuesta (debe incluir el ID del producto creado)
}

// 2) Función para subir múltiples imágenes al servidor
// Parámetros:
// - token: JWT para autenticación
// - files: array de archivos (objetos File del navegador)
export async function uploadImages(token, files) {
  // Creamos un objeto FormData para enviar archivos (no se puede usar JSON para archivos)
  const fd = new FormData();
  
  // Xano acepta repetir 'content' o usar 'content[]'. Dejamos ambas líneas (usa una):
  // Añadimos cada archivo al FormData con la clave 'content[]'
  for (const f of files) fd.append("content[]", f);          // ✅ probado contigo
  // for (const f of files) fd.append("content[]", f);     // alternativa

  // Realizamos la petición POST para subir las imágenes
  const { data } = await axios.post(
    `${STORE_BASE}/upload/image`, // URL del endpoint para subir imágenes
    fd, // FormData con los archivos
    { 
      headers: { 
        Authorization: `Bearer ${token}` // Solo incluimos el token, NO el Content-Type
      } 
    } // NUNCA pongas Content-Type a mano con FormData, axios lo configura automáticamente
  );

  // Procesamos la respuesta para asegurar que siempre devolvemos un array
  // data es un array de image-resources { path, name, type, size, mime, ... }
  const arr = Array.isArray(data) ? data : (data.files || []);
  return arr; // Devolvemos el array de información de las imágenes subidas
}

// 3) Función para asociar imágenes a un producto existente
// Parámetros:
// - token: JWT para autenticación
// - productId: ID del producto al que asociar las imágenes
// - imagesFullArray: array completo con la información de las imágenes subidas
export async function attachImagesToProduct(token, productId, imagesFullArray) {
  // Realizamos una petición PATCH para actualizar el producto con las imágenes
  const { data } = await axios.patch(
    `${STORE_BASE}/product/${productId}`, // URL con el ID del producto a actualizar
    { images: imagesFullArray }, // Enviamos el array completo de imágenes
    { 
      headers: { 
        ...makeAuthHeader(token), // Incluimos el token de autenticación
        "Content-Type": "application/json" // Especificamos que enviamos JSON
      } 
    }
  );
  return data; // Devolvemos los datos actualizados del producto
}

// 4) Función para listar productos con soporte para paginación y búsqueda
// Parámetros (objeto con propiedades opcionales):
// - token: JWT para autenticación (opcional)
// - limit: número máximo de productos a devolver (por defecto 12)
// - offset: número de productos a saltar (para paginación, por defecto 0)
// - q: término de búsqueda (por defecto vacío)
export async function listProducts({ token, limit = 12, offset = 0, q = "" } = {}) {
  // Creamos un objeto para los parámetros de consulta (query params)
  const params = {};
  // Añadimos los parámetros solo si tienen valor
  if (limit != null) params.limit = limit;
  if (offset != null) params.offset = offset;
  if (q) params.q = q; // si tu endpoint no soporta búsqueda, se ignora

  // Realizamos una petición GET para obtener la lista de productos
  const { data } = await axios.get(`${STORE_BASE}/product`, {
    headers: { ...makeAuthHeader(token) }, // Incluimos el token si existe
    params, // Añadimos los parámetros de consulta
  });

  // Procesamos la respuesta para asegurar que siempre devolvemos un array
  // Algunos backends devuelven { items: [...] } en lugar de directamente el array
  return Array.isArray(data) ? data : (data?.items ?? []);
}