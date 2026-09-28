// assets/js/cart.js
// Módulo para manejar el carrito de compras con localStorage

export class CartManager {
  constructor() {
    this.storageKey = 'luxury_cart';
    this.stockKey = 'luxury_stock';
    this.filtersKey = 'luxury_filters';

    // Inicializar el carrito
    this.initCart();

    // Escuchar cambios de storage para sincronización entre pestañas
    window.addEventListener('storage', this.handleStorageChange.bind(this));

    // Escuchar eventos de navegación (botón atrás/adelante)
    window.addEventListener('popstate', this.handlePopState.bind(this));

    // Escuchar cuando la página se hace visible nuevamente
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // Escuchar focus de la ventana
    window.addEventListener('focus', this.handleWindowFocus.bind(this));
  }

  // Inicializar carrito y stock desde localStorage
  initCart() {
    this.cart = this.getCartFromStorage();
    this.updateCartCounter();
  }

  // Obtener carrito desde localStorage
  getCartFromStorage() {
    try {
      const cartData = localStorage.getItem(this.storageKey);
      return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
      console.error('Error al leer carrito del localStorage:', error);
      return [];
    }
  }

  // Guardar carrito en localStorage
  saveCartToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.cart));
      this.updateCartCounter();
    } catch (error) {
      console.error('Error al guardar carrito en localStorage:', error);
    }
  }

  // Obtener stock personalizado desde localStorage
  getStockFromStorage() {
    try {
      const stockData = localStorage.getItem(this.stockKey);
      return stockData ? JSON.parse(stockData) : {};
    } catch (error) {
      console.error('Error al leer stock del localStorage:', error);
      return {};
    }
  }

  // Guardar stock en localStorage
  saveStockToStorage(stockUpdates) {
    try {
      const currentStock = this.getStockFromStorage();
      const updatedStock = { ...currentStock, ...stockUpdates };
      localStorage.setItem(this.stockKey, JSON.stringify(updatedStock));
    } catch (error) {
      console.error('Error al guardar stock en localStorage:', error);
    }
  }

  // Obtener filtros desde localStorage
  getFiltersFromStorage() {
    try {
      const filtersData = localStorage.getItem(this.filtersKey);
      return filtersData ? JSON.parse(filtersData) : {};
    } catch (error) {
      console.error('Error al leer filtros del localStorage:', error);
      return {};
    }
  }

  // Guardar filtros en localStorage
  saveFiltersToStorage(filters) {
    try {
      localStorage.setItem(this.filtersKey, JSON.stringify(filters));
    } catch (error) {
      console.error('Error al guardar filtros en localStorage:', error);
    }
  }

// Agregar producto al carrito
addToCart(product, quantity = 1) {
  const currentStock = this.getCurrentStock(product.id);

  if (currentStock <= 0) {
    throw new Error(`Stock insuficiente. Stock disponible: ${currentStock}`);
  }

  const existingItem = this.cart.find(item => item.id === product.id);

  // Si el producto YA está en el carrito no lo suma ni permite agregar de nuevo
  if (existingItem) {
    throw new Error(`Producto ya está en el carrito. Modifique la cantidad desde el carrito. Stock disponible: ${currentStock}`
    );
  }

  // Si no existe, agregar nuevo item
  this.cart.push({
    id: product.id,
    nombre: product.nombre,
    precio: product.precio,
    img: product.img,
    quantity: quantity
  });


    // Actualizar stock
    this.updateStock(product.id, -quantity);

    // Guardar cambios
    this.saveCartToStorage();

    return this.cart;
  }

  // Remover producto del carrito
  removeFromCart(productId) {
    const itemIndex = this.cart.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
      const removedItem = this.cart.splice(itemIndex, 1)[0];
      // Restaurar stock
      this.updateStock(productId, removedItem.quantity);
      this.saveCartToStorage();
      return removedItem;
    }
    return null;
  }

  // Disminuir cantidad de un producto en el carrito
  decreaseQuantity(productId, amount = 1) {
    const item = this.cart.find(item => item.id === productId);
    if (item && item.quantity > amount) {
      item.quantity -= amount;
      // Restaurar stock correspondiente
      this.updateStock(productId, amount);
      this.saveCartToStorage();
      return item;
    } else if (item && item.quantity === amount) {
      // Si la cantidad a disminuir es igual a la cantidad actual, eliminar item
      return this.removeFromCart(productId);
    }
    return null;
  }

  // Aumentar cantidad de un producto en el carrito
  increaseQuantity(productId, amount = 1) {
    const item = this.cart.find(item => item.id === productId);
    if (item) {
      // Verificar stock disponible
      const currentStock = this.getCurrentStock(productId);
      if (currentStock >= amount) {
        item.quantity += amount;
        // Reducir stock
        this.updateStock(productId, -amount);
        this.saveCartToStorage();
        return item;
      } else {
        throw new Error(`Stock insuficiente. Stock disponible: ${currentStock}`);
      }
    }
    return null;
  }

  // Obtener stock actual (original - cantidad en carrito)
  getCurrentStock(productId) {
    const customStock = this.getStockFromStorage();

    // Si hay stock personalizado guardado, usarlo
    if (customStock.hasOwnProperty(productId)) {
      return customStock[productId];
    }

    // Si no, necesitamos el stock original del producto
    // Este valor debería venir del módulo data.js
    return this.getOriginalStock(productId);
  }

  // Obtener stock original del producto (deberá ser llamado desde donde se importen los productos)
  getOriginalStock(productId) {
    // Esta función será complementada cuando se integre con data.js
    return 0;
  }

  // Actualizar stock
  updateStock(productId, change) {
    const currentStock = this.getCurrentStock(productId);
    const newStock = Math.max(0, currentStock + change);

    const stockUpdates = {};
    stockUpdates[productId] = newStock;
    this.saveStockToStorage(stockUpdates);
  }

  // Actualizar contador del carrito en el DOM
  updateCartCounter() {
    // SIEMPRE obtener el carrito fresco desde localStorage
    this.cart = this.getCartFromStorage();
    const counter = document.querySelector('#cart-counter');

    if (counter) {
      const totalItems = this.cart.reduce((total, item) => total + item.quantity, 0);
      const currentText = counter.textContent;

      // Solo actualizar si el valor cambió para evitar animaciones innecesarias
      if (currentText !== totalItems.toString()) {
        counter.textContent = totalItems;
        console.log(`📌 Contador actualizado: ${totalItems} items`);
      }

      if (totalItems > 0) {
        counter.style.display = 'flex';
        counter.classList.add('cart-counter-visible');
        // Animación de bounce cuando se actualiza (solo si cambió)
        if (currentText !== totalItems.toString()) {
          counter.classList.remove('cart-counter-bounce');
          setTimeout(() => counter.classList.add('cart-counter-bounce'), 10);
        }
      } else {
        counter.style.display = 'none';
        counter.classList.remove('cart-counter-visible');
      }
    } else {
      // Si el contador no existe, intentar crearlo después de un pequeño delay
      console.log('📌 Contador no encontrado, reintentando...');
      setTimeout(() => {
        const delayedCounter = document.querySelector('#cart-counter');
        if (delayedCounter) {
          this.updateCartCounter();
        }
      }, 200);
    }
  }

  // Obtener total de items en el carrito
  getTotalItems() {
    return this.cart.reduce((total, item) => total + item.quantity, 0);
  }

  // Obtener precio total del carrito
  getTotalPrice() {
    return this.cart.reduce((total, item) => total + (item.precio * item.quantity), 0);
  }

  // Obtener carrito actual
  getCart() {
    return this.cart;
  }

  // Limpiar carrito
  clearCart() {
    // Restaurar stock de todos los productos
    this.cart.forEach(item => {
      this.updateStock(item.id, item.quantity);
    });

    this.cart = [];
    this.saveCartToStorage();
  }

  // Manejar cambios de storage (sincronización entre pestañas)
  handleStorageChange(event) {
    if (event.key === this.storageKey) {
      this.cart = this.getCartFromStorage();
      this.updateCartCounter();

      // Disparar evento personalizado para notificar cambios
      window.dispatchEvent(new CustomEvent('cartUpdated', {
        detail: { cart: this.cart }
      }));
    }
  }

  // Manejar navegación con botón atrás/adelante
  handlePopState(event) {
    console.log('📌 Navegación detectada - actualizando carrito');
    // Recargar datos del carrito desde localStorage
    this.cart = this.getCartFromStorage();
    setTimeout(() => {
      this.updateCartCounter();
    }, 100);
  }

  // Manejar cambio de visibilidad de la página
  handleVisibilityChange() {
    if (!document.hidden) {
      console.log('📌 Página visible - actualizando carrito');
      // Página se hace visible, actualizar carrito
      this.cart = this.getCartFromStorage();
      setTimeout(() => {
        this.updateCartCounter();
      }, 50);
    }
  }

  // Manejar focus de la ventana
  handleWindowFocus() {
    console.log('📌 Ventana enfocada - actualizando carrito');
    // Ventana recibe focus, actualizar carrito
    this.cart = this.getCartFromStorage();
    setTimeout(() => {
      this.updateCartCounter();
    }, 50);
  }

  // Método para actualizar los productos originales con el stock actual
  updateProductsWithCurrentStock(productos) {
    const customStock = this.getStockFromStorage();

    return productos.map(producto => ({
      ...producto,
      stock: customStock.hasOwnProperty(producto.id) ?
        customStock[producto.id] :
        producto.stock
    }));
  }

  // Inicializar stock original (llamar una sola vez al cargar los productos)
  initializeStock(productos) {
    const existingStock = this.getStockFromStorage();
    const stockUpdates = {};

    productos.forEach(producto => {
      if (!existingStock.hasOwnProperty(producto.id)) {
        stockUpdates[producto.id] = producto.stock;
      }
    });

    if (Object.keys(stockUpdates).length > 0) {
      this.saveStockToStorage(stockUpdates);
    }
  }
}

// Crear instancia global del carrito
export const cartManager = new CartManager();

// Hacer disponible globalmente para las funciones auxiliares
window.cartManager = cartManager;

// Función helper para agregar el carrito a la página
export function addCartIconToPage() {
  // Verificar si ya existe
  if (document.querySelector('#cart-container-fixed')) return;

  // Crear contenedor del carrito en esquina superior derecha
  const cartContainer = document.createElement('div');
  cartContainer.id = 'cart-container-fixed';
  cartContainer.innerHTML = `
    <a href="./pages/carrito.html" id="cart-link" class="cart-icon-main" aria-label="Ir al carrito de compras">
      <div class="cart-icon-wrapper">
        <span class="cart-emoji" aria-hidden="true">🛒</span>
        <span id="cart-counter" class="cart-counter-badge" role="status" aria-live="polite" aria-label="Cantidad de productos en el carrito"></span>
      </div>
    </a>
  `;

  // Agregar al body
  document.body.appendChild(cartContainer);

  // Actualizar contador inmediatamente después de crear el ícono
  setTimeout(() => {
    if (window.cartManager) {
      window.cartManager.updateCartCounter();
    }
  }, 100);
}

// Función helper para páginas que están en subdirectorios
export function addCartIconToSubpage() {
  // Verificar si ya existe
  if (document.querySelector('#cart-container-fixed')) return;

  // Crear contenedor del carrito en esquina superior derecha
  const cartContainer = document.createElement('div');
  cartContainer.id = 'cart-container-fixed';
  cartContainer.innerHTML = `
    <a href="carrito.html" id="cart-link" class="cart-icon-main" aria-label="Ir al carrito de compras">
      <div class="cart-icon-wrapper">
        <span class="cart-emoji" aria-hidden="true">🛒</span>
        <span id="cart-counter" class="cart-counter-badge" role="status" aria-live="polite" aria-label="Cantidad de productos en el carrito"></span>
      </div>
    </a>
  `;

  // Agregar al body
  document.body.appendChild(cartContainer);

  // Actualizar contador inmediatamente después de crear el ícono
  setTimeout(() => {
    if (window.cartManager) {
      window.cartManager.updateCartCounter();
    }
  }, 100);
}

// Función para inicializar el contador cuando el DOM esté listo
function initializeCartCounter() {
  const updateCounter = () => {
    if (window.cartManager) {
      window.cartManager.updateCartCounter();
    }
  };

  // Múltiples puntos de inicialización para máxima robustez
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(updateCounter, 100);
      // Backup después de un delay más largo
      setTimeout(updateCounter, 500);
    });
  } else {
    setTimeout(updateCounter, 100);
    setTimeout(updateCounter, 300);
  }

  // También cuando la página esté completamente cargada
  window.addEventListener('load', () => {
    setTimeout(updateCounter, 100);
  });

  // Y cuando el usuario interactúa por primera vez
  const interactionEvents = ['click', 'touchstart', 'keydown'];
  const handleFirstInteraction = () => {
    updateCounter();
    // Remover los listeners después del primer uso
    interactionEvents.forEach(event => {
      document.removeEventListener(event, handleFirstInteraction);
    });
  };

  interactionEvents.forEach(event => {
    document.addEventListener(event, handleFirstInteraction, { once: true });
  });
}

// Inicializar el contador
initializeCartCounter();

// Función global para mostrar notificaciones mejoradas
window.showCartNotification = function (message, type = 'success') {
  // Remover mensaje anterior si existe
  const existingMessage = document.querySelector('.cart-notification');
  if (existingMessage) {
    existingMessage.remove();
  }

  const messageDiv = document.createElement("div");
  messageDiv.className = `cart-notification cart-notification-${type}`;
  messageDiv.innerHTML = `
    <div class="notification-icon">
      ${type === 'success' ? '✅' : '⚠️'}
    </div>
    <div class="notification-text">${message}</div>
    <div class="notification-close">×</div>
  `;

  messageDiv.style.cssText = `
    position: fixed;
    top: 100px;
    right: -400px;
    width: 350px;
    padding: 15px 20px;
    border-radius: 12px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    background: ${type === 'success' ?
      'linear-gradient(135deg, #27ae60, #2ecc71)' :
      'linear-gradient(135deg, #e74c3c, #c0392b)'};
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    border: 2px solid rgba(255, 255, 255, 0.2);
  `;

  document.body.appendChild(messageDiv);

  // Animación de entrada
  setTimeout(() => {
    messageDiv.style.right = '20px';
  }, 10);

  // Configurar botón cerrar
  const closeBtn = messageDiv.querySelector('.notification-close');
  closeBtn.style.cssText = `
    cursor: pointer;
    font-size: 20px;
    font-weight: bold;
    opacity: 0.8;
    margin-left: auto;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    transition: all 0.2s ease;
  `;

  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.opacity = '1';
    closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
    closeBtn.style.transform = 'scale(1.1)';
  });

  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.opacity = '0.8';
    closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    closeBtn.style.transform = 'scale(1)';
  });

  closeBtn.addEventListener('click', () => {
    removeCartNotification(messageDiv);
  });

  // Estilos internos
  const icon = messageDiv.querySelector('.notification-icon');
  icon.style.fontSize = '18px';

  const text = messageDiv.querySelector('.notification-text');
  text.style.cssText = 'flex: 1; line-height: 1.4;';

  // Auto-remover
  setTimeout(() => {
    removeCartNotification(messageDiv);
  }, 4000);
};

window.removeCartNotification = function (messageDiv) {
  if (messageDiv && messageDiv.parentNode) {
    messageDiv.style.right = '-400px';
    messageDiv.style.opacity = '0';

    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.parentNode.removeChild(messageDiv);
      }
    }, 400);
  }
};

// Función reutilizable para inicializar el contador del carrito
export function initializeCartCounterUpdates() {
  const updateCounter = () => {
    if (cartManager) {
      cartManager.updateCartCounter();
    }
  };

  // Actualización inicial después de DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(updateCounter, 50);
      setTimeout(updateCounter, 150);
      setTimeout(updateCounter, 300);
    });
  } else {
    // Si el DOM ya está listo, ejecutar inmediatamente
    setTimeout(updateCounter, 50);
    setTimeout(updateCounter, 150);
    setTimeout(updateCounter, 300);
  }

  // Actualizar cuando la ventana recupere el focus
  window.addEventListener('focus', updateCounter);

  // Actualizar cuando la página se haga visible
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      updateCounter();
    }
  });

  // Actualizar cuando el carrito cambie
  window.addEventListener('cartUpdated', updateCounter);

  console.log('📌 Cart counter updates initialized');
}

console.log('📌 Cart module loaded');