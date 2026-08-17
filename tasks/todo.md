# Task List: SaludFamiliar PWA

## Phase 1: Foundation, Design System & Types

- [ ] **Task 1: Scaffolding Vite React-TS, PWA & Design System Tokens**
  - **Description:** Configurar el proyecto base con Vite, TypeScript, ite-plugin-pwa, lucide-react y el sistema de tokens CSS accesibles de alto contraste y soporte responsivo móvil/escritorio.
  - **Acceptance:**
    - package.json, ite.config.ts, 	sconfig.json e index.html configurados.
    - src/index.css con variables CSS de color, tipografía y utilidades de interfaz moderna.
  - **Verify:** 
pm run dev arranca el servidor local sin advertencias.
  - **Dependencies:** None
  - **Files likely touched:** package.json, ite.config.ts, src/index.css, index.html, src/App.tsx, src/main.tsx
  - **Estimated scope:** Medium (4-5 files)

- [ ] **Task 2: Modelos de Datos TypeScript & Persistencia Híbrida**
  - **Description:** Crear interfaces completas (Patient, Medication, DoseRecord, VitalSign, MedicalStudy, Appointment, Expense, FamilyMember) y el motor de almacenamiento local reactivo (src/lib/storage.ts) con datos demo precargados para el paciente crónico y familiar temporal.
  - **Acceptance:**
    - Todos los tipos definidos estrictamente.
    - storage.ts permite guardar, cargar y restablecer datos de pacientes, tomas, signos y gastos.
  - **Verify:** Tests o llamada de lectura/escritura en consola valida persistencia tras recarga.
  - **Dependencies:** Task 1
  - **Files likely touched:** src/types/index.ts, src/lib/storage.ts, src/lib/demoData.ts
  - **Estimated scope:** Small (3 files)

---

## 🔍 Checkpoint 1: Foundation (Tasks 1-2)
- [ ] Aplicación compila (
pm run build).
- [ ] Datos de ejemplo cargan adecuadamente en el almacenamiento local.

---

## Phase 2: Patient & Medication Engine (Vertical Slice 1)

- [ ] **Task 3: Motor Matemático de Frecuencias de Medicación**
  - **Description:** Implementar src/utils/frequencyEngine.ts con funciones puras para evaluar si un medicamento toca hoy, calcular las horas exactas de toma, sus dosis fraccionadas (ej. 0.5) y proyectar el calendario de días alternos o cada $ días.
  - **Acceptance:**
    - Función 	ocaTomaHoy(regla, fecha) evalúa correctamente días alternos (diffDias % 2 === 0) y cada N días (diffDias % N === 0).
    - Función obtenerTomasDelDia(medicamento, fecha) devuelve lista de tomas con horario y dosis específicas.
  - **Verify:** Pruebas unitarias con casos: Metformina (8am 1tab, 8pm 0.5tab), Aspirina (cada 4d), Rivaroxabán (días alternos).
  - **Dependencies:** Task 2
  - **Files likely touched:** src/utils/frequencyEngine.ts, src/utils/formatters.ts
  - **Estimated scope:** Small (2 files)

- [ ] **Task 4: Contexto Global & Selector de Paciente (Multi-Perfil)**
  - **Description:** Crear AppContext.tsx y el componente de barra superior/selector de paciente para alternar entre el Adulto Mayor (crónico) y Familiares (tratamiento temporal).
  - **Acceptance:**
    - Cambio instantáneo de perfil con 1 toque.
    - Insignia visual que indica si es tratamiento crónico o temporal (con cuenta regresiva de días).
  - **Verify:** Al cambiar de paciente, las tomas y datos mostrados se filtran automáticamente.
  - **Dependencies:** Task 2, Task 3
  - **Files likely touched:** src/context/AppContext.tsx, src/components/layout/Header.tsx, src/components/layout/PatientSelector.tsx
  - **Estimated scope:** Medium (3 files)

- [ ] **Task 5: Línea de Tiempo Diaria & Marcado de Tomas**
  - **Description:** Construir la vista principal del día (*DailyTimeline*) agrupada en bloques (Mañana, Tarde, Noche), con tarjetas claras, distintivos de dosis fraccionadas (ej. 1/2 tableta) y botón de confirmación de toma.
  - **Acceptance:**
    - Muestra estado: Pendiente, Tomado o Retrasado.
    - Confirmar toma guarda fecha/hora en 	omasRegistradas y actualiza visualmente.
  - **Verify:** Marcar toma actualiza la UI al instante y persiste al recargar.
  - **Dependencies:** Task 4
  - **Files likely touched:** src/components/medications/DailyTimeline.tsx, src/components/medications/MedicationCard.tsx
  - **Estimated scope:** Small (2 files)

- [ ] **Task 6: Formulario de Medicamentos & Control de Inventario con Semáforo**
  - **Description:** Formulario modal para registrar o editar medicamentos con pautas complejas y panel de inventario de pastillas restantes con semáforo (Verde, Amarillo, Rojo) que se descuenta con cada toma confirmada.
  - **Acceptance:**
    - Permite configurar horas, dosis variables, días alternos y stock actual/mínimo.
    - Descuenta 1 o 0.5 unidades de stock al confirmar toma y muestra alerta de compra cuando baja del umbral.
  - **Verify:** Dar de alta un medicamento nuevo lo incluye en el timeline y en la lista de stock.
  - **Dependencies:** Task 5
  - **Files likely touched:** src/components/medications/MedicationForm.tsx, src/components/medications/InventoryView.tsx
  - **Estimated scope:** Medium (3 files)

---

## 🔍 Checkpoint 2: Medication Engine (Tasks 3-6)
- [ ] El ciclo completo de medicamentos funciona: alta, cálculo de frecuencias complejas, checklist diario y descuento de stock.

---

## Phase 3: Notifications & WhatsApp Delegation (Vertical Slice 2)

- [ ] **Task 7: Notificaciones Web de Escritorio y Móvil**
  - **Description:** Servicio src/lib/notifications.ts para solicitar permisos de notificación en el navegador y disparar alertas en la PC del cuidador al cumplirse los horarios de toma.
  - **Acceptance:**
    - Botón para habilitar notificaciones en el header.
    - Verificación periódica en segundo plano que avisa cuando hay tomas pendientes en la hora actual.
  - **Verify:** Alerta nativa de escritorio se despliega al disparar recordatorio.
  - **Dependencies:** Task 5
  - **Files likely touched:** src/lib/notifications.ts, src/components/common/NotificationBanner.tsx
  - **Estimated scope:** Small (2 files)

- [ ] **Task 8: Delegación por WhatsApp & Vista de Relevo Rápido**
  - **Description:** Modal para exportar la lista de tomas del día directamente a WhatsApp con formato legible y vista web ligera (/relevo) donde un suplente puede marcar tomas sin requerir inicio de sesión.
  - **Acceptance:**
    - Clic en Compartir a WhatsApp abre la app con el mensaje formateado con emojis.
    - Vista RelevoView permite marcar tomas desde celular y sincronizar.
  - **Verify:** Mensaje de WhatsApp contiene horas, nombres, dosis y enlace web.
  - **Dependencies:** Task 5
  - **Files likely touched:** src/lib/whatsapp.ts, src/components/medications/ShareModal.tsx, src/components/delegation/RelevoView.tsx
  - **Estimated scope:** Medium (3 files)

---

## 🔍 Checkpoint 3: Delegation (Tasks 7-8)
- [ ] Notificaciones en PC funcionando y flujo de delegación por WhatsApp 100% operativo.

---

## Phase 4: Vital Signs & Medical Campaigns (Vertical Slice 3)

- [ ] **Task 9: Bitácora de Signos Vitales (Glucosa, Presión, SpO2)**
  - **Description:** Formulario ágil para registrar Glucosa (con etiquetas Ayunas / Postprandial / Noche), Presión Arterial (Sistólica / Diastólica / Pulso) y Saturación de Oxígeno.
  - **Acceptance:**
    - Registro en menos de 5 segundos con validación de rangos normales/altos/bajos con semáforo de color.
    - Historial tabular con filtros por fecha y tipo de signo.
  - **Verify:** Agregar mediciones se refleja inmediatamente en el historial.
  - **Dependencies:** Task 4
  - **Files likely touched:** src/components/vitals/VitalsForm.tsx, src/components/vitals/VitalsHistory.tsx, src/components/vitals/VitalsTracker.tsx
  - **Estimated scope:** Medium (3 files)

- [ ] **Task 10: Campañas de Monitoreo (3 Días) & Gráficas de Tendencia**
  - **Description:** Módulo para configurar Campañas de Monitoreo solicitadas por el médico (ej. medir presión 3 días continuos mañana y noche) con barra de progreso y gráficas visuales de evolución.
  - **Acceptance:**
    - Permite crear reto/campaña con fecha de inicio, duración (días) y tomas requeridas.
    - Gráfica interactiva de glucosa y presión con valores objetivo.
  - **Verify:** Campaña calcula porcentaje de cumplimiento y dibuja la tendencia.
  - **Dependencies:** Task 9
  - **Files likely touched:** src/components/vitals/VitalsCampaigns.tsx, src/components/vitals/VitalsChart.tsx
  - **Estimated scope:** Small (2 files)

---

## 🔍 Checkpoint 4: Vitals (Tasks 9-10)
- [ ] Bitácora de signos y campañas de 3 días operativas con gráficas visuales.

---

## Phase 5: Studies, Appointments & Doctor Summary (Vertical Slice 4)

- [ ] **Task 11: Expediente de Estudios Clínicos con Visor de PDFs/Fotos**
  - **Description:** Módulo para archivar estudios de laboratorio y gabinete con fecha, nombre del estudio, costo y carga de archivos locales/base64 con visor modal integrado.
  - **Acceptance:**
    - Soporta subida de archivos PDF e imágenes (JPG/PNG).
    - Visualizador modal para abrir y examinar los resultados sin salir de la app.
  - **Verify:** Cargar un PDF permite abrirlo y leerlo en el modal.
  - **Dependencies:** Task 4
  - **Files likely touched:** src/components/studies/StudiesManager.tsx, src/components/studies/FileViewerModal.tsx
  - **Estimated scope:** Small (2 files)

- [ ] **Task 12: Agenda de Citas & Modo 'Resumen para el Médico' (1 Clic)**
  - **Description:** Calendario de citas con especialistas y vista imprimible/exportable de 1 página que compila medicamentos actuales, últimas mediciones de signos y últimos estudios para la consulta médica.
  - **Acceptance:**
    - Agenda de próximas citas con médico, especialidad y recordatorio.
    - Botón Ficha para el Médico genera vista compacta de alta legibilidad lista para imprimir (CSS print) o mostrar en pantalla.
  - **Verify:** Ficha médica condensa todos los datos clínicos clave del paciente en 1 hoja.
  - **Dependencies:** Task 5, Task 9, Task 11
  - **Files likely touched:** src/components/appointments/AppointmentsManager.tsx, src/components/summary/DoctorSummaryReport.tsx
  - **Estimated scope:** Medium (3 files)

---

## 🔍 Checkpoint 5: Medical Records (Tasks 11-12)
- [ ] Expediente digital de estudios y reporte de consulta médica listo para imprimir.

---

## Phase 6: Family Expense Tracking & Cost Splitter (Vertical Slice 5)

- [ ] **Task 13: Registro de Gastos de Salud & Balance Mensual**
  - **Description:** Registro de compras de farmacia, estudios y consultas médicas con fecha, monto, comprobante y etiqueta de quién realizó el pago.
  - **Acceptance:**
    - Resumen mensual con desglose por categoría (Medicinas, Estudios, Consultas).
    - Conexión automática: al registrar compra de medicamento se puede sumar directamente al inventario.
  - **Verify:** Total acumulado del mes se actualiza en tiempo real.
  - **Dependencies:** Task 4
  - **Files likely touched:** src/components/expenses/ExpenseForm.tsx, src/components/expenses/ExpenseList.tsx
  - **Estimated scope:** Small (2 files)

- [ ] **Task 14: Calculadora Familiar de División de Gastos**
  - **Description:** Módulo de administración de familiares y calculadora automática que calcula la división del gasto mensual (partes iguales o porcentajes) e indica la liquidación neta (Hermano A le debe a Hermano B).
  - **Acceptance:**
    - Permite agregar familiares y definir reglas de división (equitativa o personalizada).
    - Muestra tabla de saldos y resumen listo para copiar y enviar al grupo familiar de WhatsApp.
  - **Verify:** La suma de las partes cuadra exactamente con el total de gastos del mes.
  - **Dependencies:** Task 13
  - **Files likely touched:** src/components/expenses/FamilySplitCalculator.tsx, src/components/expenses/FamilyMembersManager.tsx
  - **Estimated scope:** Medium (3 files)

---

## 🔍 Checkpoint 6: Expenses (Tasks 13-14)
- [ ] Finanzas familiares completas: registro de compras y cálculo transparente de división de gastos.

---

## Phase 7: PWA Polish & End-to-End Verification

- [ ] **Task 15: PWA Standalone, Instalación en Móvil/PC & Verificación E2E**
  - **Description:** Configurar el Web App Manifest (manifest.json), service worker de caché offline, banner de instalación para celular/computadora y auditoría de navegación responsiva.
  - **Acceptance:**
    - Cumple criterios de PWA instalable con iconos y tema de color.
    - Funciona fluidamente sin conexión a internet.
  - **Verify:** 
pm run build genera bundle optimizado y el navegador ofrece el botón Instalar aplicación.
  - **Dependencies:** Tasks 1-14
  - **Files likely touched:** ite.config.ts, public/manifest.json, src/components/common/PwaInstallPrompt.tsx, src/main.tsx
  - **Estimated scope:** Small (3 files)

---

## 🔍 Checkpoint 7: Final End-to-End
- [ ] Todas las user stories y criterios de éxito validados en desktop y móvil.
