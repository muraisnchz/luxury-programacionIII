# API de Autocompletado de Checkout

Esta API proporciona datos de prueba aleatorios para autocompletar el formulario de checkout, facilitando las pruebas y demostraciones del sistema.

## Archivos

- **`test-data.json`**: Contiene datos de usuarios y tarjetas de prueba
- **`checkout-autocomplete.js`**: Módulo JavaScript con la lógica de autocompletado

## Características

### Datos Incluidos

#### Usuarios (15 perfiles)
- Nombre completo
- Email
- Teléfono (formato argentino)
- Dirección completa
- Ciudad
- Código postal
- Provincia

#### Tarjetas (10 tarjetas)
- Número de tarjeta (formato 16 dígitos)
- Nombre en tarjeta
- Fecha de vencimiento
- CVV

### Funcionalidades

1. **Autocompletado Aleatorio**: Selecciona automáticamente datos aleatorios de usuarios y tarjetas
2. **Formateo Automático**: Los datos se formatean correctamente (espacios en tarjeta, barra en fecha)
3. **Validación Limpia**: Limpia mensajes de error al autocompletar
4. **Botón Integrado**: Botón visual "🎲 Rellenar con datos de prueba" en el formulario

## Uso

### Desde el Modal de Checkout

1. Hacer clic en "Proceder al Pago" en el carrito
2. Buscar el botón azul "🎲 Rellenar con datos de prueba"
3. Hacer clic y el formulario se completará automáticamente

### Uso Programático

```javascript
// Importar la API
import { checkoutAutocompleteAPI } from './checkout-autocomplete.js';

// Obtener datos aleatorios
const data = await checkoutAutocompleteAPI.getRandomCheckoutData();
console.log(data);

// Autocompletar un formulario
const form = document.querySelector('#checkout-form');
await checkoutAutocompleteAPI.autocompleteForm(form, true);

// Solo datos de usuario (sin tarjeta)
await checkoutAutocompleteAPI.autocompleteForm(form, false);
```

### Métodos Disponibles

#### `loadTestData()`
Carga los datos desde el archivo JSON.

```javascript
const data = await checkoutAutocompleteAPI.loadTestData();
```

#### `getRandomUser()`
Obtiene un usuario aleatorio.

```javascript
const user = await checkoutAutocompleteAPI.getRandomUser();
// { nombre, email, telefono, direccion, ciudad, codigoPostal, provincia }
```

#### `getRandomCard()`
Obtiene una tarjeta aleatoria.

```javascript
const card = await checkoutAutocompleteAPI.getRandomCard();
// { numeroTarjeta, nombreTarjeta, vencimiento, cvv }
```

#### `getRandomCheckoutData()`
Obtiene datos completos (usuario + tarjeta).

```javascript
const checkoutData = await checkoutAutocompleteAPI.getRandomCheckoutData();
// { ...usuario, ...tarjeta, metodoPago: 'tarjeta' }
```

#### `autocompleteForm(form, includeCard)`
Autocompleta un formulario con datos aleatorios.

- **form**: HTMLFormElement - El formulario a completar
- **includeCard**: boolean - Si debe incluir datos de tarjeta (default: true)

```javascript
const form = document.querySelector('#checkout-form');
await checkoutAutocompleteAPI.autocompleteForm(form, true);
```

#### `addAutocompleteButton(form, position)`
Agrega un botón de autocompletar al formulario.

- **form**: HTMLFormElement - Formulario donde agregar el botón
- **position**: string - 'before' o 'after' (default: 'before')

```javascript
checkoutAutocompleteAPI.addAutocompleteButton(form, 'before');
```

## Datos de Ejemplo

### Usuario
```json
{
  "nombre": "María Fernanda González",
  "email": "maria.gonzalez@email.com",
  "telefono": "+54 11 4567-8901",
  "direccion": "Av. Santa Fe 2450",
  "ciudad": "Buenos Aires",
  "codigoPostal": "1425",
  "provincia": "CABA"
}
```

### Tarjeta
```json
{
  "numeroTarjeta": "4532 1234 5678 9010",
  "nombreTarjeta": "MARIA F GONZALEZ",
  "vencimiento": "12/26",
  "cvv": "123"
}
```

## Cobertura de Provincias

El sistema incluye usuarios de diversas provincias argentinas:
- Ciudad Autónoma de Buenos Aires
- Buenos Aires
- Córdoba
- Santa Fe
- Mendoza
- Tucumán
- Salta
- Corrientes
- Neuquén
- Entre Ríos
- Y más...

## Fallback

Si falla la carga del archivo JSON, la API genera datos básicos automáticamente como respaldo, asegurando que la funcionalidad siempre esté disponible.

## Notas de Seguridad

⚠️ **IMPORTANTE**: Estos son datos de prueba generados aleatoriamente. No son datos reales de personas ni tarjetas válidas. No intentes usar estos números de tarjeta en transacciones reales.

## Personalización

Para agregar más usuarios o tarjetas, edita el archivo `test-data.json` siguiendo la estructura existente.
