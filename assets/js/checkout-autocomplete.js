// assets/js/checkout-autocomplete.js

/**
 * API de autocompletado de datos de prueba para el formulario de checkout
 * Genera datos aleatorios de usuarios argentinos para testing
 */

class CheckoutAutocompleteAPI {
  constructor() {
    this.testData = null;
    this.dataLoaded = false;
  }

  /**
   * Cargar datos de prueba desde el archivo JSON
   */
  async loadTestData() {
    if (this.dataLoaded && this.testData) {
      return this.testData;
    }

    try {
      const response = await fetch('../assets/api/datapersona.json');
      if (!response.ok) {
        throw new Error(`Error al cargar datos: ${response.status}`);
      }
      this.testData = await response.json();
      this.dataLoaded = true;
      return this.testData;
    } catch (error) {
      console.error('Error cargando datos de prueba:', error);
      // Fallback: generar datos básicos si falla la carga del JSON
      return this.generateFallbackData();
    }
  }

  /**
   * Generar datos aleatorios si falla la carga del JSON
   */
  generateFallbackData() {
    const nombres = ['Juan Pérez', 'María González', 'Carlos López', 'Ana Martínez'];
    const ciudades = ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza'];
    const provincias = ['CABA', 'Buenos Aires', 'Córdoba', 'Santa Fe'];
    
    const randomIndex = Math.floor(Math.random() * nombres.length);
    
    return {
      usuarios: [{
        nombre: nombres[randomIndex],
        email: `usuario${Math.floor(Math.random() * 1000)}@email.com`,
        telefono: `+54 11 ${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        direccion: `Calle ${Math.floor(100 + Math.random() * 9900)}`,
        ciudad: ciudades[randomIndex],
        codigoPostal: String(Math.floor(1000 + Math.random() * 8999)),
        provincia: provincias[randomIndex]
      }],
      tarjetas: [{
        numeroTarjeta: `4532 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
        nombreTarjeta: nombres[randomIndex].toUpperCase(),
        vencimiento: `${String(Math.floor(1 + Math.random() * 12)).padStart(2, '0')}/${String(26 + Math.floor(Math.random() * 5))}`,
        cvv: String(Math.floor(100 + Math.random() * 900))
      }]
    };
  }

  /**
   * Obtener un usuario aleatorio de los datos cargados
   */
  async getRandomUser() {
    await this.loadTestData();
    const randomIndex = Math.floor(Math.random() * this.testData.usuarios.length);
    return this.testData.usuarios[randomIndex];
  }

  /**
   * Obtener una tarjeta aleatoria de los datos cargados
   */
  async getRandomCard() {
    await this.loadTestData();
    const randomIndex = Math.floor(Math.random() * this.testData.tarjetas.length);
    return this.testData.tarjetas[randomIndex];
  }

  /**
   * Obtener datos completos aleatorios (usuario + tarjeta)
   */
  async getRandomCheckoutData() {
    const usuario = await this.getRandomUser();
    const tarjeta = await this.getRandomCard();
    
    return {
      ...usuario,
      ...tarjeta,
      metodoPago: 'tarjeta' // Por defecto usar tarjeta para mostrar todos los campos
    };
  }

  /**
   * Autocompletar el formulario de checkout con datos aleatorios
   * @param {HTMLFormElement} form - El formulario a autocompletar
   * @param {boolean} includeCard - Si debe incluir datos de tarjeta
   */
  async autocompleteForm(form, includeCard = true) {
    try {
      const data = await this.getRandomCheckoutData();
      
      // Completar datos personales
      const nombreInput = form.querySelector('#checkout-nombre');
      const emailInput = form.querySelector('#checkout-email');
      const telefonoInput = form.querySelector('#checkout-telefono');
      
      if (nombreInput) {
        nombreInput.value = data.nombre;
        this.triggerInputEvent(nombreInput);
      }
      
      if (emailInput) {
        emailInput.value = data.email;
        this.triggerInputEvent(emailInput);
      }
      
      if (telefonoInput) {
        telefonoInput.value = data.telefono;
        this.triggerInputEvent(telefonoInput);
      }

      // Completar dirección
      const direccionInput = form.querySelector('#checkout-direccion');
      const ciudadInput = form.querySelector('#checkout-ciudad');
      const codigoPostalInput = form.querySelector('#checkout-codigo-postal');
      const provinciaSelect = form.querySelector('#checkout-provincia');
      
      if (direccionInput) {
        direccionInput.value = data.direccion;
        this.triggerInputEvent(direccionInput);
      }
      
      if (ciudadInput) {
        ciudadInput.value = data.ciudad;
        this.triggerInputEvent(ciudadInput);
      }
      
      if (codigoPostalInput) {
        codigoPostalInput.value = data.codigoPostal;
        this.triggerInputEvent(codigoPostalInput);
      }
      
      if (provinciaSelect) {
        provinciaSelect.value = data.provincia;
        this.triggerInputEvent(provinciaSelect);
      }

      // Completar datos de pago si se solicita
      if (includeCard) {
        // Seleccionar método de pago tarjeta
        const tarjetaRadio = form.querySelector('input[name="metodoPago"][value="tarjeta"]');
        if (tarjetaRadio) {
          tarjetaRadio.checked = true;
          this.triggerInputEvent(tarjetaRadio);
          
          // Disparar evento change para mostrar campos de tarjeta
          const changeEvent = new Event('change', { bubbles: true });
          tarjetaRadio.dispatchEvent(changeEvent);
          
          // Esperar un momento para que se muestren los campos
          await this.sleep(100);
          
          // Completar datos de tarjeta
          const numeroTarjetaInput = form.querySelector('#checkout-numero-tarjeta');
          const nombreTarjetaInput = form.querySelector('#checkout-nombre-tarjeta');
          const vencimientoInput = form.querySelector('#checkout-vencimiento');
          const cvvInput = form.querySelector('#checkout-cvv');
          
          if (numeroTarjetaInput) {
            numeroTarjetaInput.value = data.numeroTarjeta;
            this.triggerInputEvent(numeroTarjetaInput);
          }
          
          if (nombreTarjetaInput) {
            nombreTarjetaInput.value = data.nombreTarjeta;
            this.triggerInputEvent(nombreTarjetaInput);
          }
          
          if (vencimientoInput) {
            vencimientoInput.value = data.vencimiento;
            this.triggerInputEvent(vencimientoInput);
          }
          
          if (cvvInput) {
            cvvInput.value = data.cvv;
            this.triggerInputEvent(cvvInput);
          }
        }
      }

      // Limpiar todos los mensajes de error
      form.querySelectorAll('.error-message').forEach(span => {
        span.textContent = '';
      });
      
      form.querySelectorAll('.input-error').forEach(input => {
        input.classList.remove('input-error');
      });

      return data;
    } catch (error) {
      console.error('Error autocompletando formulario:', error);
      throw error;
    }
  }

  /**
   * Disparar eventos de input para activar validaciones y formateos
   */
  triggerInputEvent(element) {
    const inputEvent = new Event('input', { bubbles: true });
    const changeEvent = new Event('change', { bubbles: true });
    element.dispatchEvent(inputEvent);
    element.dispatchEvent(changeEvent);
  }

  /**
   * Función auxiliar para esperar
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Agregar botón de autocompletar al formulario
   * @param {HTMLFormElement} form - Formulario donde agregar el botón
   * @param {string} position - Posición del botón ('before' o 'after')
   */
  addAutocompleteButton(form, position = 'before') {
    // Verificar si ya existe el botón
    if (document.querySelector('#btn-autocomplete-checkout')) {
      return;
    }

    const button = document.createElement('button');
    button.id = 'btn-autocomplete-checkout';
    button.type = 'button';
    button.className = 'btn-autocomplete-test';
    button.innerHTML = '🎲 Rellenar con datos de prueba';
    button.setAttribute('aria-label', 'Autocompletar formulario con datos de prueba');
    
    // Estilos inline para el botón
    button.style.cssText = `
      width: 100%;
      padding: 12px 20px;
      background: linear-gradient(135deg, #3498db, #2980b9);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    `;

    // Efectos hover
    button.addEventListener('mouseenter', () => {
      button.style.background = 'linear-gradient(135deg, #2980b9, #21618c)';
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 20px rgba(52, 152, 219, 0.4)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = 'none';
    });

    // Funcionalidad de autocompletar
    button.addEventListener('click', async () => {
      button.disabled = true;
      button.innerHTML = '⏳ Cargando datos...';
      
      try {
        await this.autocompleteForm(form, true);
        button.innerHTML = '✅ ¡Datos cargados!';
        
        // Restaurar botón después de 2 segundos
        setTimeout(() => {
          button.disabled = false;
          button.innerHTML = '🎲 Rellenar con datos de prueba';
        }, 2000);
      } catch (error) {
        button.innerHTML = '❌ Error al cargar';
        setTimeout(() => {
          button.disabled = false;
          button.innerHTML = '🎲 Rellenar con datos de prueba';
        }, 2000);
      }
    });

    // Insertar botón en el formulario
    const targetElement = position === 'before' 
      ? form.querySelector('fieldset') 
      : form.querySelector('.checkout-actions');
    
    if (targetElement) {
      if (position === 'before') {
        targetElement.parentNode.insertBefore(button, targetElement);
      } else {
        targetElement.parentNode.insertBefore(button, targetElement);
      }
    }
  }
}

// Crear instancia global de la API
const checkoutAutocompleteAPI = new CheckoutAutocompleteAPI();

// Exportar para uso en módulos
export { checkoutAutocompleteAPI, CheckoutAutocompleteAPI };

// También hacer disponible globalmente para uso directo
if (typeof window !== 'undefined') {
  window.checkoutAutocompleteAPI = checkoutAutocompleteAPI;
  window.CheckoutAutocompleteAPI = CheckoutAutocompleteAPI;
}
