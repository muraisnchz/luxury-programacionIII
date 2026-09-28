// Capturamos el formulario
const form = document.querySelector(".formulario form");

form.addEventListener("submit", validarFormulario);

function validarFormulario(event) {
  event.preventDefault(); // Evita el envío si hay errores

  // Captura de campos
  const nombre = document.getElementById("nombre");
  const email = document.getElementById("email");
  const asunto = document.getElementById("asunto");
  const mensaje = document.getElementById("mensaje");

  // Eliminamos mensajes previos de error (si los hubiera)
  limpiarErrores();

  let esValido = true;

  // --- Validar nombre ---
  const valorNombre = nombre.value.trim();
  if (valorNombre.length < 3 || /\d/.test(valorNombre)) {
    mostrarError(nombre, "El nombre debe tener al menos 3 letras y no contener números.");
    esValido = false;
  } else {
    marcarValido(nombre);
  }

  // --- Validar correo ---
  const valorEmail = email.value.trim();
  const patronEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!patronEmail.test(valorEmail)) {
    mostrarError(email, "Ingresá un correo electrónico válido (ejemplo@dominio.com).");
    esValido = false;
  } else {
    marcarValido(email);
  }

  // --- Validar asunto ---
  const valorAsunto = asunto.value.trim();
  if (valorAsunto.length < 3) {
    mostrarError(asunto, "El asunto debe tener al menos 3 caracteres.");
    esValido = false;
  } else {
    marcarValido(asunto);
  }

  // --- Validar mensaje ---
  const valorMensaje = mensaje.value.trim();
  if (valorMensaje.length < 10) {
    mostrarError(mensaje, "El mensaje debe tener al menos 10 caracteres.");
    esValido = false;
  } else {
    marcarValido(mensaje);
  }

  // --- Si todo está correcto ---
  if (esValido) {
    alert("✅ ¡Formulario enviado correctamente!");
    form.reset();
    // Quitamos las clases de validación para limpiar los bordes
    [nombre, email, asunto, mensaje].forEach(campo => {
      campo.classList.remove("is-valid");
      campo.classList.remove("is-invalid");
    });
  }
}

// Función para mostrar mensaje de error debajo del campo
function mostrarError(input, mensaje) {
  input.classList.add("is-invalid");
  input.classList.remove("is-valid");

  // Creamos el elemento del mensaje si no existe
  let feedback = input.parentElement.querySelector(".invalid-feedback");
  if (!feedback) {
    feedback = document.createElement("div");
    feedback.classList.add("invalid-feedback");
    input.parentElement.appendChild(feedback);
  }
  feedback.textContent = mensaje;
}

// Marca el campo como válido (verde)
function marcarValido(input) {
  input.classList.add("is-valid");
  input.classList.remove("is-invalid");
}

// Limpia mensajes previos de error
function limpiarErrores() {
  const errores = document.querySelectorAll(".invalid-feedback");
  errores.forEach(e => e.remove());
}
