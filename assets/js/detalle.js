import { cartManager, addCartIconToSubpage, initializeCartCounterUpdates } from "./cart.js";

const contenedor = document.querySelector("#detalleProducto");
const params = new URLSearchParams(window.location.search);
const id = parseInt(params.get("id"));

//Guarda todos los productos aquí
let originalProductos = []; 

// Agregar carrito a la página
addCartIconToSubpage();

// Inicializar actualizaciones del contador (función reutilizable)
initializeCartCounterUpdates();

function renderizar(prod) {
  if (!prod) {
    contenedor.innerHTML = `<p>Producto no encontrado.</p>`;
    return;
  }

  const stockDisponible = prod.stock > 0;


  contenedor.innerHTML = `
<div class="card-detalle">
 <h2>${prod.nombre}</h2>
 <img src="${prod.img}" alt="${prod.alt}">
 <p>${prod.descripcion}</p>
 <p>Categoría: ${prod.categoria}</p>
 <p><strong>Precio: $${prod.precio.toLocaleString("es-AR")}</strong></p>
 <p>Stock disponible: <span id="stock-display">${stockDisponible ? prod.stock : 0}</span></p>
 <div class="cantidad-selector" ${!stockDisponible ? 'style="display: none;"' : ''}>
 <label for="cantidad">Cantidad:</label>
 <select id="cantidad" aria-label="Menú despleable para seleccionar la cantidad de productos">
 ${Array.from({ length: Math.min(prod.stock) }, (_, i) =>
    `<option value="${i + 1}">${i + 1}</option>`
  ).join('')}
 </select>
 </div>
 <button id="btnCarrito" aria-label="Botón para agregar producto al carrito" ${!stockDisponible ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
 ${stockDisponible ? 'Agregar al carrito' : 'Sin stock'}
 </button>
 <div id="mensaje" style="margin-top: 10px; font-weight: bold;"></div>
 </div>
`;

  const btn = document.querySelector("#btnCarrito");
  const cantidadSelect = document.querySelector("#cantidad");
  const mensaje = document.querySelector("#mensaje");

  if (btn && stockDisponible) {
    btn.addEventListener("click", () => {
      try {
        const cantidad = parseInt(cantidadSelect.value);
        cartManager.addToCart(prod, cantidad);

        // ... (lógica de notificación sin cambios)
        if (window.showCartNotification) {
          window.showCartNotification(`${cantidad} ${prod.nombre}(s) agregado(s) al carrito`, 'success');
        } else {
          mensaje.style.color = "#27ae60";
          mensaje.textContent = `${cantidad} ${prod.nombre}(s) agregado(s) al carrito`;
        }

        // Actualizar vista después de un pequeño delay
        setTimeout(() => {
          
          cargarDetalleProducto();
          if (!window.showCartNotification) {
            mensaje.textContent = "";
          }
        }, 1500);

      } catch (error) {
        // ... (lógica de notificación de error sin cambios)
        if (window.showCartNotification) {
          window.showCartNotification(error.message, 'error');
        } else {
          mensaje.style.color = "#e74c3c";
          mensaje.textContent = error.message;
        }
        if (!window.showCartNotification) {
          setTimeout(() => {
            mensaje.textContent = "";
          }, 3000);
        }
      }
    });
  }
}


function cargarDetalleProducto() {
  // Obtener la lista completa con stock actualizado
  const productosConStock = cartManager.updateProductsWithCurrentStock(originalProductos);

  //Encontrar el producto específico por ID
  const productoActualizado = productosConStock.find(p => p.id === id);

  //Renderizarlo
  renderizar(productoActualizado);
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

async function initializeApp() {
  try {
    //Cargar los datos del JSON con manejo robusto de errores
    originalProductos = await fetchWithErrorHandling('../assets/api/datajoyas.json', 'productos');

    // Validar estructura de datos antes de usar
    validateProducts(originalProductos);
    
    cartManager.getOriginalStock = function (productId) {
      const producto = originalProductos.find(p => p.id === productId);
      return producto ? producto.stock : 0;
    };
    cartManager.initializeStock(originalProductos);

    //Cargar/renderizar el producto por primera vez
    cargarDetalleProducto();

  } catch (error) {
    console.error("No se pudo inicializar la página de detalle:", error);
    contenedor.innerHTML = "<p>Hubo un error al cargar el producto. Por favor, intente más tarde.</p>";
  }
}

// Escuchar cambios en el carrito para actualizar la vista
window.addEventListener('cartUpdated', () => {
  
  cargarDetalleProducto();
});

// Escuchar cambios de localStorage para sincronización
window.addEventListener('storage', (event) => {
  if (event.key === 'luxury_stock') {
        cargarDetalleProducto();
  }
});

initializeApp();