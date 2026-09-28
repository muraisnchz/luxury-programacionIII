import { cartManager, addCartIconToSubpage, initializeCartCounterUpdates } from "./cart.js";

const contenedor = document.querySelector("#catalogo");
const filtro = document.querySelector("#categorias");
const searchInput = document.querySelector("#search-input");
const ordenamiento = document.querySelector("#ordenamiento");
const resultsInfo = document.querySelector("#results-info");

//Variable para guardar productos
let originalProductos = [];
let searchTerm = '';

addCartIconToSubpage();

// Inicializar actualizaciones del contador (función reutilizable)
initializeCartCounterUpdates();


function renderizar(lista) {
  contenedor.innerHTML = "";
  
  // Mostrar información de resultados
  updateResultsInfo(lista.length);

  // Si no hay resultados, mostrar mensaje
  if (lista.length === 0) {
    const noResultsDiv = document.createElement("div");
    noResultsDiv.classList.add("no-results");
    noResultsDiv.innerHTML = `
      <h3>😕 No se encontraron productos</h3>
      <p>No hay productos que coincidan con tu búsqueda.</p>
      <p><strong>Sugerencias:</strong></p>
      <p>• Intenta con otras palabras clave</p>
      <p>• Verifica la ortografía</p>
      <p>• Selecciona una categoría diferente</p>
    `;
    contenedor.appendChild(noResultsDiv);
    return;
  }

  lista.forEach(prod => {
    const div = document.createElement("div");
    div.classList.add("producto");

    const stockDisponible = prod.stock > 0;
    const stockMessage = stockDisponible ?
      `Stock: ${prod.stock}` :
      '<span style="color: #e74c3c;">Sin stock</span>';


    div.innerHTML = `
 <h3>${prod.nombre}</h3>
 <img src="${prod.img}" alt="${prod.alt}">
 <p><strong>Precio: $${prod.precio.toLocaleString("es-AR")}</strong></p>
 <p>${prod.descripcion}</p>
 <p>Categoría: ${prod.categoria} • ${stockMessage}</p>
 <a href="producto.html?id=${prod.id}">
 <button aria-label="Ver detalles producto" ${!stockDisponible ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
Ver detalles
</button>
</a>
`;
    contenedor.appendChild(div);
  });
}

// Función para actualizar información de resultados
function updateResultsInfo(count) {
  if (searchTerm.trim() !== '' || filtro.value !== '') {
    resultsInfo.style.display = 'block';
    let infoText = `Se encontraron <strong>${count}</strong> producto${count !== 1 ? 's' : ''}`;
    
    if (searchTerm.trim() !== '') {
      infoText += ` para "<strong>${searchTerm}</strong>"`;
    }
    
    if (filtro.value !== '') {
      infoText += ` en la categoría <strong>${filtro.value}</strong>`;
    }
    
    resultsInfo.innerHTML = infoText;
  } else {
    resultsInfo.style.display = 'none';
  }
}

// Función para ordenar productos
function ordenarProductos(productos, criterio) {
  const productosCopia = [...productos]; // Crear copia para no mutar el original
  
  switch (criterio) {
    case 'precio-asc':
      return productosCopia.sort((a, b) => a.precio - b.precio);
    
    case 'precio-desc':
      return productosCopia.sort((a, b) => b.precio - a.precio);
    
    case 'nombre-asc':
      return productosCopia.sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    case 'nombre-desc':
      return productosCopia.sort((a, b) => b.nombre.localeCompare(a.nombre));
    
    case 'stock-desc':
      return productosCopia.sort((a, b) => b.stock - a.stock);
    
    case 'default':
    default:
      return productosCopia; // Orden original (por ID)
  }
}

// Cargar productos con stock actualizado, búsqueda y ordenamiento
function cargarProductos() {

  //Obtiene productos con stock actualizado
  let productosConStock = cartManager.updateProductsWithCurrentStock(originalProductos);

  //Obtiene el valor actual del filtro de categoría
  const cat = filtro.value;

  //Obtiene el término de búsqueda
  searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

  //Obtiene el criterio de ordenamiento
  const criterioOrden = ordenamiento ? ordenamiento.value : 'default';

  //Filtra por categoría
  if (cat) {
    productosConStock = productosConStock.filter(p => p.categoria === cat);
  }

  //Filtra por búsqueda (nombre y descripción)
  if (searchTerm !== '') {
    productosConStock = productosConStock.filter(p => {
      const nombre = p.nombre.toLowerCase();
      const descripcion = p.descripcion.toLowerCase();
      const categoria = p.categoria.toLowerCase();
      
      return nombre.includes(searchTerm) || 
             descripcion.includes(searchTerm) || 
             categoria.includes(searchTerm);
    });
  }

  //Aplica ordenamiento
  productosConStock = ordenarProductos(productosConStock, criterioOrden);

  //Renderiza la lista filtrada y ordenada
  renderizar(productosConStock);
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


    const savedFilters = cartManager.getFiltersFromStorage();
    if (savedFilters.categoria) {
      filtro.value = savedFilters.categoria;
    }

  
    cargarProductos();

  } catch (error) {
    console.error("No se pudo inicializar el catálogo:", error);
    contenedor.innerHTML = "<p>Hubo un error al cargar los productos. Por favor, intente más tarde.</p>";
  }
}

// Manejar filtro por categorías
filtro.addEventListener("change", () => {
  const cat = filtro.value;

  //Guardar filtro seleccionado
  cartManager.saveFiltersToStorage({ categoria: cat });

  cargarProductos();
});

// Manejar búsqueda en tiempo real
if (searchInput) {
  searchInput.addEventListener("input", () => {
    cargarProductos();
  });

  // También buscar al presionar Enter
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === 'Enter') {
      cargarProductos();
    }
  });
}

// Manejar ordenamiento
if (ordenamiento) {
  ordenamiento.addEventListener("change", () => {
    cargarProductos();
  });
}



//Escuchar cambios en el carrito para actualizar stock
window.addEventListener('cartUpdated', () => {
  cargarProductos(); 
});

// Escuchar cambios de localStorage para sincronización
window.addEventListener('storage', (event) => {
  if (event.key === 'luxury_stock') {
    cargarProductos();
  }
});


initializeApp();