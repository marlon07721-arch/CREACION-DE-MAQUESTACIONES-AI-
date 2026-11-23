/* =========================================================
   NÁVITA · app.js
   Interacciones: menú móvil, filtro de productos, botones
   "Solicitar" y "Quiero ser distribuidor", y validación del
   formulario. No envía datos a ningún servidor.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 1. Menú móvil ---------- */
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('menu-principal');

  // Abre o cierra el menú y actualiza los atributos ARIA
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }

  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    setMenu(!isOpen);
  });

  // Cierra el menú al elegir una opción
  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  // Cierra el menú con la tecla Escape y devuelve el foco al botón
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setMenu(false);
      navToggle.focus();
    }
  });


  /* ---------- 2. Filtro de productos ---------- */
  const filterButtons = document.querySelectorAll('[data-filter]');
  const products = document.querySelectorAll('.product-card');
  const filterStatus = document.getElementById('filtro-estado');

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const category = button.dataset.filter;
      let visible = 0;

      // Marca solo el botón activo
      filterButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));

      // Muestra u oculta cada tarjeta según su categoría
      products.forEach((card) => {
        const show = category === 'todos' || card.dataset.category === category;
        card.hidden = !show;
        if (show) visible++;
      });

      // Anuncia el resultado (aria-live)
      filterStatus.textContent = `Mostrando ${visible} ${visible === 1 ? 'producto' : 'productos'}`;
    });
  });


  /* ---------- 3. Formulario: referencias ---------- */
  const form = document.getElementById('form-cotizacion');
  const fields = {
    nombre: document.getElementById('nombre'),
    correo: document.getElementById('correo'),
    telefono: document.getElementById('telefono'),
    producto: document.getElementById('producto'),
  };
  const tipoRadios = form.querySelectorAll('input[name="tipo"]');
  const successMessage = document.getElementById('form-exito');
  const contactSection = document.getElementById('contacto');


  /* ---------- 4. Botones "Solicitar" ---------- */
  // Llevan al formulario y escriben el producto elegido
  document.querySelectorAll('[data-product]').forEach((button) => {
    button.addEventListener('click', () => {
      fields.producto.value = button.dataset.product;
      successMessage.textContent = '';
      contactSection.scrollIntoView({ behavior: 'smooth' });
      // preventScroll evita un salto brusco mientras se desplaza
      fields.nombre.focus({ preventScroll: true });
    });
  });


  /* ---------- 5. Botón "Quiero ser distribuidor" ---------- */
  // Preselecciona el tipo de cliente "Profesional"
  document.getElementById('btn-distribuidor').addEventListener('click', () => {
    form.querySelector('input[value="profesional"]').checked = true;
    clearError(document.getElementById('tipo-error'));
  });


  /* ---------- 6. Validación del formulario ---------- */
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const phonePattern = /^3\d{9}$/;   // celular colombiano: 10 dígitos, empieza por 3

  // Muestra el mensaje de error debajo del campo
  function showError(input, errorEl, message) {
    errorEl.textContent = message;
    if (input) {
      input.setAttribute('aria-invalid', 'true');
      input.closest('.form-field').classList.add('has-error');
    }
  }

  // Limpia el error de un campo
  function clearError(errorEl, input) {
    errorEl.textContent = '';
    if (input) {
      input.removeAttribute('aria-invalid');
      input.closest('.form-field').classList.remove('has-error');
    }
  }

  // Reglas de validación: cada una devuelve '' si es válido o el mensaje de error
  const rules = {
    nombre: (v) => (v.trim().length >= 3 ? '' : 'Escribe tu nombre completo (mínimo 3 letras).'),
    correo: (v) => {
      if (!v.trim()) return 'Escribe tu correo electrónico.';
      return emailPattern.test(v.trim()) ? '' : 'El correo no es válido. Ejemplo: nombre@correo.com';
    },
    telefono: (v) => {
      if (!v.trim()) return 'Escribe tu número de celular.';
      return phonePattern.test(v.trim()) ? '' : 'El celular debe tener 10 dígitos y empezar por 3.';
    },
  };

  // Valida un campo de texto y devuelve true si es correcto
  function validateField(name) {
    const input = fields[name];
    const errorEl = document.getElementById(`${name}-error`);
    const message = rules[name](input.value);
    if (message) {
      showError(input, errorEl, message);
      return false;
    }
    clearError(errorEl, input);
    return true;
  }

  // Valida que se haya elegido un tipo de cliente
  function validateTipo() {
    const errorEl = document.getElementById('tipo-error');
    const checked = form.querySelector('input[name="tipo"]:checked');
    if (!checked) {
      showError(null, errorEl, 'Selecciona si eres profesional o cliente final.');
      return false;
    }
    clearError(errorEl);
    return true;
  }

  // Solo permite números en el teléfono
  fields.telefono.addEventListener('input', () => {
    fields.telefono.value = fields.telefono.value.replace(/\D/g, '');
  });

  // Valida cada campo al salir de él (blur)
  Object.keys(rules).forEach((name) => {
    fields[name].addEventListener('blur', () => {
      if (fields[name].value) validateField(name);
    });
  });

  tipoRadios.forEach((radio) => radio.addEventListener('change', validateTipo));

  // Envío del formulario
  form.addEventListener('submit', (event) => {
    event.preventDefault();          // nunca se envía a un servidor
    successMessage.textContent = '';

    const results = [
      validateField('nombre'),
      validateField('correo'),
      validateField('telefono'),
      validateTipo(),
    ];

    if (results.includes(false)) {
      // Lleva el foco al primer campo con error
      const firstInvalid = form.querySelector('[aria-invalid="true"]') ||
        (!form.querySelector('input[name="tipo"]:checked') ? tipoRadios[0] : null);
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Todo es válido: muestra la confirmación y limpia el formulario
    const firstName = fields.nombre.value.trim().split(' ')[0];
    form.reset();
    successMessage.textContent = `¡Gracias, ${firstName}! Un asesor de Návita te contactará en menos de 24 horas.`;
  });


  /* ---------- 7. Año actual en el footer ---------- */
  document.getElementById('anio').textContent = new Date().getFullYear();
});
