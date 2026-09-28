// assets/js/carrito.js
import { cartManager, addCartIconToSubpage, initializeCartCounterUpdates } from "./cart.js";

const cartItemsContainer = document.querySelector("#cart-items");
const cartSummary = document.querySelector("#cart-summary");
const emptyCartMessage = document.querySelector("#empty-cart");
const totalItemsSpan = document.querySelector("#total-items");
const totalPriceSpan = document.querySelector("#total-price");
const checkoutBtn = document.querySelector("#checkout-btn");
const clearCartBtn = document.querySelector("#clear-cart-btn");

// Agregar carrito a la página
addCartIconToSubpage();

// Inicializar actualizaciones del contador (función reutilizable)
initializeCartCounterUpdates();

function renderCartItems() {
  const cart = cartManager.getCart();

  if (cart.length === 0) {
    // Mostrar mensaje de carrito vacío
    cartItemsContainer.innerHTML = "";
    cartSummary.style.display = "none";
    emptyCartMessage.style.display = "block";
    return;
  }

  // Ocultar mensaje vacío y mostrar carrito
  emptyCartMessage.style.display = "none";
  cartSummary.style.display = "block";

  // Renderizar items del carrito
  cartItemsContainer.innerHTML = "";

  cart.forEach(item => {
    const cartItem = document.createElement("div");
    cartItem.classList.add("cart-item");
    cartItem.innerHTML = `
      <div class="cart-item-info">
        <img src="${item.img}" alt="${item.nombre}" class="cart-item-image">
        <div class="cart-item-details">
          <h4>${item.nombre}</h4>
          <p class="cart-item-price">$${item.precio.toLocaleString("es-AR")} c/u</p>
          <div class="cart-item-quantity">
            <span>Cantidad: </span>
            <div class="quantity-controls">
              <button aria-label="Botón para disminuir la cantidad de productos" class="btn-quantity btn-decrease" data-id="${item.id}" ${item.quantity <= 1 ? 'disabled' : ''}>
                −
              </button>
              <span class="quantity-display">${item.quantity}</span>
              <button aria-label="Botón para aumentar la cantidad de productos" class="btn-quantity btn-increase" data-id="${item.id}">
                +
              </button>
            </div>
          </div>
          <p class="cart-item-subtotal">Subtotal: $${(item.precio * item.quantity).toLocaleString("es-AR")}</p>
        </div>
      </div>
      <div class="cart-item-actions">
        <button aria-label="Botón para eliminar todos los productos" class="btn-remove-all" data-id="${item.id}">
          🗑️ Eliminar Todo
        </button>
      </div>
    `;
    cartItemsContainer.appendChild(cartItem);
  });

  // Actualizar resumen
  updateCartSummary();

  // Agregar event listeners para controles de cantidad
  document.querySelectorAll(".btn-decrease").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const productId = parseInt(e.target.dataset.id);
      decreaseQuantity(productId);
    });
  });

  document.querySelectorAll(".btn-increase").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const productId = parseInt(e.target.dataset.id);
      increaseQuantity(productId);
    });
  });

  // Agregar event listeners para eliminar items completos
  document.querySelectorAll(".btn-remove-all").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const productId = parseInt(e.target.dataset.id);
      removeAllItemFromCart(productId);
    });
  });
}

function updateCartSummary() {
  const totalItems = cartManager.getTotalItems();
  const totalPrice = cartManager.getTotalPrice();

  totalItemsSpan.textContent = totalItems;
  totalPriceSpan.textContent = totalPrice.toLocaleString("es-AR");
}

function decreaseQuantity(productId) {
  try {
    const cart = cartManager.getCart();
    const item = cart.find(item => item.id === productId);

    if (item && item.quantity > 1) {
      // Disminuir en 1
      cartManager.decreaseQuantity(productId, 1);
      showMessage(`${item.nombre} - cantidad reducida`, "success");
      renderCartItems();
    } else if (item && item.quantity === 1) {
      // Si queda solo 1, preguntar si quiere eliminar con modal
      showConfirmModal({
        title: 'Última unidad',
        message: `Esta es la última unidad de <strong>${item.nombre}</strong> en tu carrito. ¿Deseas eliminarlo completamente?`,
        icon: '⚠️',
        confirmText: 'Sí, eliminar',
        cancelText: 'No, mantener',
        onConfirm: () => {
          const removedItem = cartManager.removeFromCart(productId);
          if (removedItem) {
            showMessage(`${removedItem.nombre} eliminado del carrito`, "success");
            renderCartItems();
          }
        }
      });
    }
  } catch (error) {
    showMessage("Error al reducir cantidad", "error");
  }
}

function increaseQuantity(productId) {
  try {
    const cart = cartManager.getCart();
    const item = cart.find(item => item.id === productId);

    if (item) {
      // Verificar stock disponible
      const currentStock = cartManager.getCurrentStock(productId);
      if (currentStock >= 1) {
        cartManager.increaseQuantity(productId, 1);
        showMessage(`${item.nombre} - cantidad aumentada`, "success");
        renderCartItems();
      } else {
        showMessage("No hay más stock disponible", "error");
      }
    }
  } catch (error) {
    showMessage("Error al aumentar cantidad", "error");
  }
}

function removeAllItemFromCart(productId) {
  try {
    const cart = cartManager.getCart();
    const item = cart.find(item => item.id === productId);

    if (item) {
      showConfirmModal({
        title: '¿Eliminar producto?',
        message: `¿Estás seguro de que quieres eliminar <strong>${item.nombre}</strong> del carrito? (${item.quantity} unidades)`,
        icon: '🗑️',
        confirmText: 'Sí, eliminar',
        cancelText: 'Cancelar',
        onConfirm: () => {
          const removedItem = cartManager.removeFromCart(productId);
          if (removedItem) {
            showMessage(`${removedItem.nombre} eliminado completamente del carrito`, "success");
            renderCartItems();
          }
        }
      });
    }
  } catch (error) {
    showMessage("Error al eliminar el producto", "error");
  }
}

// Función para crear y mostrar modal de confirmación
function showConfirmModal(options) {
  const { title, message, icon, confirmText, cancelText, onConfirm, onCancel, confirmClass } = options;

  // Crear overlay del modal
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';
  modalOverlay.innerHTML = `
    <div class="modal-content" role="dialog" aria-labelledby="modal-title" aria-describedby="modal-description">
      <div class="modal-header">
        <span class="modal-icon" aria-hidden="true">${icon || '⚠️'}</span>
        <h3 id="modal-title">${title || 'Confirmar acción'}</h3>
      </div>
      <div class="modal-body" id="modal-description">
        ${message || '¿Estás seguro de continuar?'}
      </div>
      <div class="modal-footer">
        <button class="modal-btn modal-btn-cancel" id="modal-cancel-btn">
          ${cancelText || 'Cancelar'}
        </button>
        <button class="modal-btn modal-btn-confirm ${confirmClass || ''}" id="modal-confirm-btn">
          ${confirmText || 'Confirmar'}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  // Mostrar modal con animación
  setTimeout(() => modalOverlay.classList.add('active'), 10);

  // Focus en el botón cancelar para accesibilidad
  const cancelBtn = modalOverlay.querySelector('#modal-cancel-btn');
  const confirmBtn = modalOverlay.querySelector('#modal-confirm-btn');

  setTimeout(() => cancelBtn.focus(), 100);

  // Función para cerrar modal
  const closeModal = () => {
    modalOverlay.classList.remove('active');
    setTimeout(() => modalOverlay.remove(), 300);
  };

  // Event listeners
  cancelBtn.addEventListener('click', () => {
    closeModal();
    if (onCancel) onCancel();
  });

  confirmBtn.addEventListener('click', () => {
    closeModal();
    if (onConfirm) onConfirm();
  });

  // Navegación por teclado (Tab trap dentro del modal)
  const focusableElements = modalOverlay.querySelectorAll('button');
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      if (onCancel) onCancel();
      document.removeEventListener('keydown', handleKeyDown);
    }

    // Tab trap
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    }
  };
  document.addEventListener('keydown', handleKeyDown);

  // Cerrar al hacer click fuera del modal
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
      if (onCancel) onCancel();
    }
  });
}

function clearCart() {
  showConfirmModal({
    title: '¿Vaciar carrito?',
    message: '¿Estás seguro de que quieres eliminar todos los productos del carrito? Esta acción no se puede deshacer.',
    icon: '🗑️',
    confirmText: 'Sí, vaciar',
    cancelText: 'No, mantener',
    confirmClass: '',
    onConfirm: () => {
      cartManager.clearCart();
      showMessage("Carrito vaciado exitosamente", "success");
      renderCartItems();
    }
  });
}

function showMessage(message, type) {
  // Usar la función global de notificaciones
  if (window.showCartNotification) {
    window.showCartNotification(message, type);
  } else {
    // Fallback simple si la función global no está disponible
    alert(message);
  }
}

function simulateCheckout() {
  const cart = cartManager.getCart();
  if (cart.length === 0) {
    showMessage("No hay productos en el carrito", "error");
    return;
  }

  const totalPrice = cartManager.getTotalPrice();
  const totalItems = cartManager.getTotalItems();

  // Mostrar modal con formulario de checkout
  showCheckoutFormModal(totalPrice, totalItems);
}

function showCheckoutFormModal(totalPrice, totalItems) {
  // Crear overlay del modal de checkout
  const checkoutOverlay = document.createElement('div');
  checkoutOverlay.className = 'checkout-modal-overlay';
  checkoutOverlay.innerHTML = `
    <div class="checkout-modal-content" role="dialog" aria-labelledby="checkout-title">
      <div class="checkout-modal-header">
        <h2 id="checkout-title">💳 Finalizar Compra</h2>
        <button class="checkout-close-btn" aria-label="Cerrar formulario">&times;</button>
      </div>
      
      <div class="checkout-modal-body">
        <!-- Resumen de compra -->
        <div class="checkout-summary">
          <h3>📦 Resumen de tu pedido</h3>
          <p><strong>Total de productos:</strong> ${totalItems} unidades</p>
          <p class="checkout-total"><strong>Total a pagar:</strong> <span class="price-highlight">$${totalPrice.toLocaleString("es-AR")}</span></p>
        </div>

        <!-- Formulario de datos -->
        <form id="checkout-form" class="checkout-form" novalidate>
          
          <!-- Datos Personales -->
          <fieldset class="form-section">
            <legend>👤 Datos Personales</legend>
            
            <div class="form-row">
              <div class="form-group">
                <label for="checkout-nombre">Nombre completo *</label>
                <input type="text" id="checkout-nombre" name="nombre" required 
                       placeholder="Ej: Juan Pérez" autocomplete="name">
                <span class="error-message" id="error-nombre"></span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="checkout-email">Email *</label>
                <input type="email" id="checkout-email" name="email" required 
                       placeholder="ejemplo@correo.com" autocomplete="email">
                <span class="error-message" id="error-email"></span>
              </div>

              <div class="form-group">
                <label for="checkout-telefono">Teléfono *</label>
                <input type="tel" id="checkout-telefono" name="telefono" required 
                       placeholder="+54 11 1234-5678" autocomplete="tel">
                <span class="error-message" id="error-telefono"></span>
              </div>
            </div>
          </fieldset>

          <!-- Dirección de Envío -->
          <fieldset class="form-section">
            <legend>📍 Dirección de Envío</legend>
            
            <div class="form-row">
              <div class="form-group">
                <label for="checkout-direccion">Calle y número *</label>
                <input type="text" id="checkout-direccion" name="direccion" required 
                       placeholder="Ej: Av. Corrientes 1234" autocomplete="street-address">
                <span class="error-message" id="error-direccion"></span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="checkout-ciudad">Ciudad *</label>
                <input type="text" id="checkout-ciudad" name="ciudad" required 
                       placeholder="Ej: Buenos Aires" autocomplete="address-level2">
                <span class="error-message" id="error-ciudad"></span>
              </div>

              <div class="form-group">
                <label for="checkout-codigo-postal">Código Postal *</label>
                <input type="text" id="checkout-codigo-postal" name="codigoPostal" required 
                       placeholder="Ej: 1414" autocomplete="postal-code">
                <span class="error-message" id="error-codigo-postal"></span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="checkout-provincia">Provincia *</label>
                <select id="checkout-provincia" name="provincia" required autocomplete="address-level1">
                  <option value="">Seleccionar provincia</option>
                  <option value="Buenos Aires">Buenos Aires</option>
                  <option value="CABA">Ciudad Autónoma de Buenos Aires</option>
                  <option value="Catamarca">Catamarca</option>
                  <option value="Chaco">Chaco</option>
                  <option value="Chubut">Chubut</option>
                  <option value="Córdoba">Córdoba</option>
                  <option value="Corrientes">Corrientes</option>
                  <option value="Entre Ríos">Entre Ríos</option>
                  <option value="Formosa">Formosa</option>
                  <option value="Jujuy">Jujuy</option>
                  <option value="La Pampa">La Pampa</option>
                  <option value="La Rioja">La Rioja</option>
                  <option value="Mendoza">Mendoza</option>
                  <option value="Misiones">Misiones</option>
                  <option value="Neuquén">Neuquén</option>
                  <option value="Río Negro">Río Negro</option>
                  <option value="Salta">Salta</option>
                  <option value="San Juan">San Juan</option>
                  <option value="San Luis">San Luis</option>
                  <option value="Santa Cruz">Santa Cruz</option>
                  <option value="Santa Fe">Santa Fe</option>
                  <option value="Santiago del Estero">Santiago del Estero</option>
                  <option value="Tierra del Fuego">Tierra del Fuego</option>
                  <option value="Tucumán">Tucumán</option>
                </select>
                <span class="error-message" id="error-provincia"></span>
              </div>
            </div>
          </fieldset>

          <!-- Método de Pago -->
          <fieldset class="form-section">
            <legend>💳 Método de Pago</legend>
            
            <div class="payment-methods">
              <label class="payment-option">
                <input type="radio" name="metodoPago" value="tarjeta" checked>
                <span class="payment-label">
                  <span class="payment-icon">💳</span>
                  Tarjeta de Crédito/Débito
                </span>
              </label>

              <label class="payment-option">
                <input type="radio" name="metodoPago" value="transferencia">
                <span class="payment-label">
                  <span class="payment-icon">🏦</span>
                  Transferencia Bancaria
                </span>
              </label>

              <label class="payment-option">
                <input type="radio" name="metodoPago" value="efectivo">
                <span class="payment-label">
                  <span class="payment-icon">💵</span>
                  Efectivo (al recibir)
                </span>
              </label>
            </div>

            <!-- Campos de tarjeta (se muestran condicionalmente) -->
            <div id="tarjeta-fields" class="tarjeta-fields">
              <div class="form-row">
                <div class="form-group">
                  <label for="checkout-numero-tarjeta">Número de tarjeta</label>
                  <input type="text" id="checkout-numero-tarjeta" name="numeroTarjeta" 
                         placeholder="1234 5678 9012 3456" maxlength="19" autocomplete="cc-number">
                  <span class="error-message" id="error-numero-tarjeta"></span>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="checkout-nombre-tarjeta">Nombre en la tarjeta</label>
                  <input type="text" id="checkout-nombre-tarjeta" name="nombreTarjeta" 
                         placeholder="JUAN PEREZ" autocomplete="cc-name">
                  <span class="error-message" id="error-nombre-tarjeta"></span>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="checkout-vencimiento">Vencimiento</label>
                  <input type="text" id="checkout-vencimiento" name="vencimiento" 
                         placeholder="MM/AA" maxlength="5" autocomplete="cc-exp">
                  <span class="error-message" id="error-vencimiento"></span>
                </div>

                <div class="form-group">
                  <label for="checkout-cvv">CVV</label>
                  <input type="text" id="checkout-cvv" name="cvv" 
                         placeholder="123" maxlength="4" autocomplete="cc-csc">
                  <span class="error-message" id="error-cvv"></span>
                </div>
              </div>
            </div>
          </fieldset>

          <!-- Botones de acción -->
          <div class="checkout-actions">
            <button type="button" class="btn-checkout-cancel">
              ❌ Cancelar
            </button>
            <button type="submit" class="btn-checkout-submit">
              ✅ Confirmar Compra - $${totalPrice.toLocaleString("es-AR")}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(checkoutOverlay);

  // Mostrar modal con animación
  setTimeout(() => checkoutOverlay.classList.add('active'), 10);

  // Referencias a elementos
  const form = checkoutOverlay.querySelector('#checkout-form');
  const closeBtn = checkoutOverlay.querySelector('.checkout-close-btn');
  const cancelBtn = checkoutOverlay.querySelector('.btn-checkout-cancel');
  const metodoPagoRadios = checkoutOverlay.querySelectorAll('input[name="metodoPago"]');
  const tarjetaFields = checkoutOverlay.querySelector('#tarjeta-fields');

  // Agregar botón de autocompletar para pruebas (carga dinámica)
  loadCheckoutAutocompleteAPI(form);

  // Enfocar en primer campo
  setTimeout(() => {
    checkoutOverlay.querySelector('#checkout-nombre').focus();
  }, 100);

  // Función para cerrar modal
  const closeCheckoutModal = () => {
    checkoutOverlay.classList.remove('active');
    setTimeout(() => checkoutOverlay.remove(), 300);
  };

  // Event listeners para cerrar
  closeBtn.addEventListener('click', closeCheckoutModal);
  cancelBtn.addEventListener('click', closeCheckoutModal);

  checkoutOverlay.addEventListener('click', (e) => {
    if (e.target === checkoutOverlay) {
      closeCheckoutModal();
    }
  });

  // Mostrar/ocultar campos de tarjeta según método de pago
  metodoPagoRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'tarjeta') {
        tarjetaFields.style.display = 'block';
        // Hacer campos requeridos
        tarjetaFields.querySelectorAll('input').forEach(input => {
          input.required = true;
        });
      } else {
        tarjetaFields.style.display = 'none';
        // Quitar requeridos
        tarjetaFields.querySelectorAll('input').forEach(input => {
          input.required = false;
          input.value = '';
        });
        // Limpiar errores
        tarjetaFields.querySelectorAll('.error-message').forEach(span => {
          span.textContent = '';
        });
      }
    });
  });

  // Formateo de número de tarjeta
  const numeroTarjetaInput = checkoutOverlay.querySelector('#checkout-numero-tarjeta');
  numeroTarjetaInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\s/g, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    e.target.value = formattedValue;
  });

  // Formateo de vencimiento
  const vencimientoInput = checkoutOverlay.querySelector('#checkout-vencimiento');
  vencimientoInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    e.target.value = value;
  });

  // Validación y envío del formulario
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (validateCheckoutForm(form)) {
      const formData = new FormData(form);
      const checkoutData = Object.fromEntries(formData.entries());

      // Procesar compra
      processCheckout(checkoutData, totalPrice, totalItems);
      closeCheckoutModal();
    }
  });

  // Navegación con teclado (Escape para cerrar)
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeCheckoutModal();
      document.removeEventListener('keydown', handleKeyDown);
    }
  };
  document.addEventListener('keydown', handleKeyDown);
}

function validateCheckoutForm(form) {
  let isValid = true;

  // Limpiar errores previos
  form.querySelectorAll('.error-message').forEach(span => {
    span.textContent = '';
  });

  form.querySelectorAll('input[required], select[required]').forEach(input => {
    input.classList.remove('input-error');
  });

  // Validar campos requeridos
  const nombre = form.querySelector('#checkout-nombre');
  if (!nombre.value.trim()) {
    showFieldError('error-nombre', 'El nombre es requerido');
    nombre.classList.add('input-error');
    isValid = false;
  }

  const email = form.querySelector('#checkout-email');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value.trim()) {
    showFieldError('error-email', 'El email es requerido');
    email.classList.add('input-error');
    isValid = false;
  } else if (!emailRegex.test(email.value)) {
    showFieldError('error-email', 'Email inválido');
    email.classList.add('input-error');
    isValid = false;
  }

  const telefono = form.querySelector('#checkout-telefono');
  if (!telefono.value.trim()) {
    showFieldError('error-telefono', 'El teléfono es requerido');
    telefono.classList.add('input-error');
    isValid = false;
  }

  const direccion = form.querySelector('#checkout-direccion');
  if (!direccion.value.trim()) {
    showFieldError('error-direccion', 'La dirección es requerida');
    direccion.classList.add('input-error');
    isValid = false;
  }

  const ciudad = form.querySelector('#checkout-ciudad');
  if (!ciudad.value.trim()) {
    showFieldError('error-ciudad', 'La ciudad es requerida');
    ciudad.classList.add('input-error');
    isValid = false;
  }

  const codigoPostal = form.querySelector('#checkout-codigo-postal');
  if (!codigoPostal.value.trim()) {
    showFieldError('error-codigo-postal', 'El código postal es requerido');
    codigoPostal.classList.add('input-error');
    isValid = false;
  }

  const provincia = form.querySelector('#checkout-provincia');
  if (!provincia.value) {
    showFieldError('error-provincia', 'Selecciona una provincia');
    provincia.classList.add('input-error');
    isValid = false;
  }

  // Validar campos de tarjeta si está seleccionado
  const metodoPago = form.querySelector('input[name="metodoPago"]:checked').value;
  if (metodoPago === 'tarjeta') {
    const numeroTarjeta = form.querySelector('#checkout-numero-tarjeta');
    const numeroLimpio = numeroTarjeta.value.replace(/\s/g, '');
    if (!numeroLimpio || numeroLimpio.length < 13) {
      showFieldError('error-numero-tarjeta', 'Número de tarjeta inválido');
      numeroTarjeta.classList.add('input-error');
      isValid = false;
    }

    const nombreTarjeta = form.querySelector('#checkout-nombre-tarjeta');
    if (!nombreTarjeta.value.trim()) {
      showFieldError('error-nombre-tarjeta', 'Nombre en tarjeta requerido');
      nombreTarjeta.classList.add('input-error');
      isValid = false;
    }

    const vencimiento = form.querySelector('#checkout-vencimiento');
    const vencimientoRegex = /^\d{2}\/\d{2}$/;
    if (!vencimientoRegex.test(vencimiento.value)) {
      showFieldError('error-vencimiento', 'Formato: MM/AA');
      vencimiento.classList.add('input-error');
      isValid = false;
    }

    const cvv = form.querySelector('#checkout-cvv');
    if (!cvv.value || cvv.value.length < 3) {
      showFieldError('error-cvv', 'CVV inválido');
      cvv.classList.add('input-error');
      isValid = false;
    }
  }

  return isValid;
}

function showFieldError(errorId, message) {
  const errorSpan = document.getElementById(errorId);
  if (errorSpan) {
    errorSpan.textContent = message;
  }
}

function processCheckout(checkoutData, totalPrice, totalItems) {
  // Mostrar mensaje de procesamiento
  showMessage("Procesando tu compra...", "success");

  // Simular procesamiento de pago
  setTimeout(() => {
    showConfirmModal({
      title: '✅ ¡Compra exitosa!',
      message: `
        <p><strong>Gracias por tu compra, ${checkoutData.nombre}!</strong></p>
        <p>Hemos recibido tu pedido de ${totalItems} productos por un total de <strong>$${totalPrice.toLocaleString("es-AR")}</strong>.</p>
        <p style="margin-top: 15px;">Recibirás un email de confirmación en <strong>${checkoutData.email}</strong></p>
        <p>Tu pedido será enviado a: <strong>${checkoutData.direccion}, ${checkoutData.ciudad}, ${checkoutData.provincia}</strong></p>
        <p style="margin-top: 15px; font-size: 0.9rem; color: #c997d8;">Método de pago: ${getPaymentMethodName(checkoutData.metodoPago)}</p>
      `,
      icon: '🎉',
      confirmText: 'Aceptar',
      cancelText: null,
      confirmClass: 'success',
      onConfirm: () => {
        // Limpiar carrito
        cartManager.clearCart();
        renderCartItems();
        showMessage("Tu carrito ha sido vaciado. ¡Gracias por tu compra!", "success");
      }
    });
  }, 1500);
}

function getPaymentMethodName(metodo) {
  const metodos = {
    'tarjeta': 'Tarjeta de Crédito/Débito',
    'transferencia': 'Transferencia Bancaria',
    'efectivo': 'Efectivo al recibir'
  };
  return metodos[metodo] || metodo;
}

/**
 * Cargar API de autocompletado de forma dinámica (opcional)
 * Si falla la carga, el formulario funciona normalmente sin autocompletado
 */
async function loadCheckoutAutocompleteAPI(form) {
  try {
    const module = await import('./checkout-autocomplete.js');
    const checkoutAutocompleteAPI = module.checkoutAutocompleteAPI;

    if (checkoutAutocompleteAPI && typeof checkoutAutocompleteAPI.addAutocompleteButton === 'function') {
      checkoutAutocompleteAPI.addAutocompleteButton(form, 'before');
    }
  } catch (error) {
    // Si falla la carga del módulo de autocompletado, no hacer nada
    // El formulario sigue funcionando normalmente
    console.log('Módulo de autocompletado no disponible (opcional)');
  }
}

// Event listeners
clearCartBtn.addEventListener("click", clearCart);
checkoutBtn.addEventListener("click", simulateCheckout);

// Escuchar cambios en el carrito
window.addEventListener('cartUpdated', () => {
  renderCartItems();
});

// Escuchar cambios de localStorage para sincronización
window.addEventListener('storage', (event) => {
  if (event.key === 'luxury_cart') {
    renderCartItems();
  }
});

// Renderizar carrito al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  renderCartItems();
});