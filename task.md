# 📋 Plan de Tareas de Ingeniería de Software: SaludFamiliar PWA

> **Metodología de Ejecución:**
> - **Paso a paso estricto:** No se avanza a la siguiente tarea hasta que la anterior esté completamente implementada, probada y verificada.
> - **Skills explícitos en cada tarea:** Cada paso indica qué skills de ingeniería gobiernan su ejecución (TDD, Source-Driven Development, Frontend UI Engineering, Incremental Implementation).

---

## 🗺️ Tareas Numeradas de Implementación

### Tarea 1: Scaffolding, TypeScript & Configuración de Testing (TDD Base)
- **Skills aplicados:**
  - 🛠️ source-driven-development: Configuración oficial de Vite + React 18 + Vitest según itejs.dev y itest.dev.
  - 🧪 	est-driven-development: Configuración del entorno de pruebas unitarias para el ciclo Red-Green-Refactor.
- **Entregable:** itest configurado y un primer test de prueba (sanity.test.ts) pasando exitosamente con 
pm test.
- **Criterio de Aceptación:** 
pm test y 
pm run build ejecutan sin errores.

---

### Tarea 2: Motor de Frecuencias de Medicamentos con TDD
- **Skills aplicados:**
  - 🧪 	est-driven-development: Escribir primero las pruebas unitarias (	ests/frequencyEngine.test.ts) con todos los casos clínicos complejos antes de la lógica.
  - 🛠️ source-driven-development: Fechas UTC determinísticas y tipos TypeScript estrictos.
- **Casos de Prueba (Red -> Green):**
  1. Metformina diaria con dosis variables (1 tableta a las 8:00 AM y 0.5 tableta a las 8:00 PM).
  2. Rivaroxabán en días alternos (un día sí, un día no).
  3. Aspirina cada 4 días (diffDias % 4 === 0).
  4. Antibiótico temporal (cada 12 horas por 7 días con fecha de término).
- **Criterio de Aceptación:** Todas las pruebas del motor de frecuencias pasan al 100%.

---

### Tarea 3: Capa de Persistencia Offline & Contexto Global React
- **Skills aplicados:**
  - 🛠️ source-driven-development: Patrón oficial de React Context + LocalStorage / Web Storage API (MDN).
  - 🧱 incremental-implementation: Estado centralizado sin mutaciones directas.
- **Entregable:** AppContext con CRUD completo para pacientes, medicamentos, tomas, signos y gastos con respaldo local.
- **Criterio de Aceptación:** Pruebas unitarias de almacenamiento y persistencia verificadas.

---

### Tarea 4: Header, Barra de Estado y Selector Multi-Perfil de Paciente
- **Skills aplicados:**
  - 🎨 rontend-ui-engineering: Diseño accesible, táctil, responsivo y de alto contraste para cuidadores.
  - 🛠️ source-driven-development: Modales accesibles con foco y soporte para teclado.
- **Entregable:** Selector rápido para alternar entre perfil crónico (Adulto Mayor) y perfil temporal (Familiar con tratamiento agudo).
- **Criterio de Aceptación:** Cambio de paciente filtra la información en pantalla al instante.

---

### Tarea 5: Línea de Tiempo Diaria de Medicamentos & Confirmación de Tomas
- **Skills aplicados:**
  - 🎨 rontend-ui-engineering: Tarjetas de alta legibilidad, distintivos destacados para fracciones (1/2 pastilla) y estados visuales (Pendiente / Tomado / Retrasado).
  - 🧱 incremental-implementation: Conexión directa con descuento de stock en tiempo real.
- **Entregable:** Checklist interactivo del día agrupado por horarios (Mañana, Tarde, Noche).
- **Criterio de Aceptación:** Marcar toma actualiza el estado y descuenta del inventario.

---

### Tarea 6: Formulario de Medicamentos & Control de Inventario con Semáforo
- **Skills aplicados:**
  - 🎨 rontend-ui-engineering: Formulario modal guiado para programar reglas complejas en menos de 1 minuto.
  - 🛠️ source-driven-development: Validación estricta de formularios y semáforo de stock (Verde / Amarillo / Rojo).
- **Entregable:** Vista de inventario de pastillas restantes y alertas de compra.
- **Criterio de Aceptación:** Alerta visual automática cuando el stock sea menor o igual al mínimo.

---

### Tarea 7: Alertas de Escritorio (PC) & Delegación Rápida a WhatsApp
- **Skills aplicados:**
  - 🛠️ source-driven-development: Web Notifications API oficial de MDN (Notification.requestPermission, 
ew Notification).
  - 📱 source-driven-development: Codificación URL estándar WHATWG para enlaces universales de WhatsApp (wa.me/?text=...).
- **Entregable:** Botón para activar alertas en PC y modal para exportar el checklist del día con emojis y enlace web de relevo.
- **Criterio de Aceptación:** Alerta de prueba en el navegador y generación del mensaje de WhatsApp estructurado.

---

### Tarea 8: Bitácora de Signos Vitales & Campañas de Monitoreo de 3 Días
- **Skills aplicados:**
  - 🧪 	est-driven-development: Pruebas de cálculo de promedios y validación de rangos clínicos.
  - 🎨 rontend-ui-engineering: Entrada rápida de Glucosa (ayunas/postprandial), Presión y SpO2 con gráficas de evolución.
- **Entregable:** Registro de signos y módulo de  Campañas médicas (reto de 3 días con barra de progreso).
- **Criterio de Aceptación:** Gráfica interactiva de tendencias y cálculo de cumplimiento de campañas.

---

### Tarea 9: Expediente de Estudios Digitales & Agenda de Citas Médicas
- **Skills aplicados:**
  - 🛠️ source-driven-development: File API y Blob URLs / FileReader de MDN para previsualización local y subida segura de PDFs y fotos.
  - 🎨 rontend-ui-engineering: Visor modal de documentos y calendario de citas con especialistas.
- **Entregable:** Archivo de análisis clínicos con visor y agenda médica con notas de preparación.
- **Criterio de Aceptación:** Subir y visualizar un PDF o imagen de laboratorio sin salir de la app.

---

### Tarea 10: Modo Resumen para el Médico (1 Clic)
- **Skills aplicados:**
  - 🎨 rontend-ui-engineering: Hoja clínica limpia optimizada para pantalla y para impresión física (@media print).
  - 🛠️ source-driven-development: CSS Paged Media standards para reportes médicos en 1 sola hoja.
- **Entregable:** Ficha clínica consolidada que resume medicamentos activos, últimas tomas de signos y últimos estudios para la consulta.
- **Criterio de Aceptación:** Vista de impresión en 1 página lista para mostrar o entregar al doctor.

---

### Tarea 11: Control de Gastos Médicos & Calculadora de División Familiar
- **Skills aplicados:**
  - 🧪 	est-driven-development: Pruebas del algoritmo de liquidación familiar (Hermano A le debe a Hermano B).
  - 🎨 rontend-ui-engineering: Dashboard financiero mensual con desglose por categoría (Farmacia, Estudios, Consultas).
- **Entregable:** Registro de tickets de compra y tabla de división con botón de compartir resumen de cuentas a WhatsApp.
- **Criterio de Aceptación:** La suma de las partes cuadra exactamente con el total gastado en el mes.

---

### Tarea 12: Configuración PWA, Modo Offline y Verificación Integral E2E
- **Skills aplicados:**
  - 🛠️ source-driven-development: Web App Manifest y Service Worker según estándares W3C.
  - 🧱 incremental-implementation: Auditoría de instalación en PC (Windows/Chrome/Edge) y móviles (Android/iOS).
- **Entregable:** Aplicación 100% instalable con soporte offline y experiencia fluida.
- **Criterio de Aceptación:** Build de producción exitoso y app funcionando de forma autónoma.