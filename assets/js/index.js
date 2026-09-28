// assets/js/index.js

import { addCartIconToPage, cartManager, initializeCartCounterUpdates } from "./cart.js";

const contenedor = document.querySelector("#destacados");

// Agregar carrito a la página principal
addCartIconToPage();

// Inicializar actualizaciones del contador (función reutilizable)
initializeCartCounterUpdates();

//Para guardar los productos
let originalProductos = [];

function renderizar(lista) {
  contenedor.innerHTML = "";
  lista.forEach(prod => {
    const div = document.createElement("div");
    div.classList.add("producto");

    // Determinar si hay stock disponible
    const stockDisponible = prod.stock > 0;
    const stockMessage = stockDisponible ?
      `Stock: ${prod.stock}` :
      '<span style="color: #e74c3c;">Sin stock</span>';

    div.innerHTML = `
      <h3>${prod.nombre}</h3>
      <img src="${prod.imgIndex}" alt="${prod.alt}">
      <p><strong>Precio: $${prod.precio.toLocaleString("es-AR")}</strong></p>
      <p>${prod.descripcion}</p>
      <p>Categoría: ${prod.categoria} • ${stockMessage}</p>
      <a href="./pages/producto.html?id=${prod.id}">
        <button aria-label="Botón para ver detalles del producto" ${!stockDisponible ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
          Ver detalles
        </button>
      </a>
    `;
    contenedor.appendChild(div);
  });
}

// Cargar productos con stock actualizado
function cargarDestacados() {

  const productosConStock = cartManager.updateProductsWithCurrentStock(originalProductos);
  const destacados = productosConStock.slice(0, 3);
  renderizar(destacados);
}

// Función para validar estructura de productos
function validateProducts(products) {
  if (!Array.isArray(products)) {
    throw new Error('Los datos de productos deben ser un array.');
  }

  if (products.length === 0) {
    throw new Error('No hay productos disponibles en la base de datos.');
  }

  const requiredFields = ['id', 'nombre', 'descripcion', 'categoria', 'precio', 'stock', 'imgIndex', 'img', 'alt'];
  
  products.forEach((prod, index) => {
    // Verificar que tenga todos los campos requeridos
    requiredFields.forEach(field => {
      if (prod[field] === undefined || prod[field] === null) {
        throw new Error(`Producto en posición ${index} no tiene el campo requerido: ${field}`);
      }
    });

    // Validaciones de tipo
    if (typeof prod.id !== 'number' || prod.id <= 0) {
      throw new Error(`Producto "${prod.nombre || 'desconocido'}" tiene un ID inválido.`);
    }

    if (typeof prod.nombre !== 'string' || prod.nombre.trim() === '') {
      throw new Error(`Producto con ID ${prod.id} tiene un nombre inválido.`);
    }

    if (typeof prod.precio !== 'number' || prod.precio < 0) {
      throw new Error(`Producto "${prod.nombre}" tiene un precio inválido.`);
    }

    if (typeof prod.stock !== 'number' || prod.stock < 0) {
      throw new Error(`Producto "${prod.nombre}" tiene un stock inválido.`);
    }

    // Validar categorías permitidas
    const categoriasPermitidas = ['cadenas', 'anillos', 'pendientes', 'relojes'];
    if (!categoriasPermitidas.includes(prod.categoria)) {
      throw new Error(`Producto "${prod.nombre}" tiene una categoría inválida: ${prod.categoria}`);
    }
  });

  return true;
}

// Función helper para manejar errores HTTP
async function fetchWithErrorHandling(url, errorContext = 'datos') {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      // Manejar diferentes códigos de error HTTP
      switch (response.status) {
        case 404:
          throw new Error(`No se encontró el archivo de ${errorContext}. Verifica la ruta.`);
        case 500:
          throw new Error(`Error del servidor al cargar ${errorContext}. Intenta más tarde.`);
        case 403:
          throw new Error(`Acceso denegado a ${errorContext}.`);
        default:
          throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    // Distinguir entre errores de red y errores de parsing
    if (error instanceof SyntaxError) {
      throw new Error(`El archivo de ${errorContext} tiene formato JSON inválido.`);
    } else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(`Sin conexión: No se pudo cargar ${errorContext}. Verifica tu conexión a internet.`);
    }
    throw error; // Re-lanzar otros errores
  }
}

//Función 'main' asíncrona para cargar datos
async function initializeApp() {
  try {
    //Cargar los datos del JSON con manejo robusto de errores
    originalProductos = await fetchWithErrorHandling('./assets/api/datajoyas.json', 'productos');

    // Validar estructura de datos antes de usar
    validateProducts(originalProductos);
  
    //Configurar cartManager para que sepa de dónde sacar el stock original
    cartManager.getOriginalStock = function (productId) {
      const producto = originalProductos.find(p => p.id === productId);
      return producto ? producto.stock : 0;
    };


    cartManager.initializeStock(originalProductos);


    cargarDestacados();

  } catch (error) {
    console.error("No se pudo inicializar la aplicación:", error);
    contenedor.innerHTML = "<p>Hubo un error al cargar los productos. Por favor, intente más tarde.</p>";
  }
}

// Escuchar cambios en el carrito para actualizar stock
window.addEventListener('cartUpdated', () => {
  cargarDestacados();
});

//Escuchar cambios de localStorage para sincronización
window.addEventListener('storage', (event) => {
  if (event.key === 'luxury_stock') {
    cargarDestacados();
  }
});


initializeApp();