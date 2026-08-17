# Implementation Plan: SaludFamiliar PWA

## Overview
Construcción vertical de **SaludFamiliar PWA**, una aplicación web progresiva en React + TypeScript que centraliza el cuidado del adulto mayor y tratamientos temporales de la familia. El plan está estructurado en rebanadas verticales (*vertical slices*), donde cada tarea entrega valor funcional completo y verificable (modelo + lógica + UI).

---

## Architecture Decisions
1. **Vertical Slicing:** Cada módulo (Medicamentos, Signos Vitales, Estudios, Gastos) se implementa de punta a punta con su lógica, almacenamiento y UI.
2. **Capa de Almacenamiento Híbrida (Offline-First):** Persistencia inmediata en localStorage / IndexedDB con sincronización reactiva, permitiendo uso 100% funcional sin conexión y compatibilidad directa con Firebase.
3. **Motor de Frecuencias Determinístico:** Función pura de evaluación de fechas capaz de proyectar tomas a futuro para esquemas de días alternos, cada $ días, fracciones de pastilla y tratamientos por horas con fecha límite.
4. **PWA Standalone & Web Notifications:** Instalable en Windows/Mac y Android/iOS con notificaciones de escritorio para el cuidador en su PC de trabajo.
5. **Delegación Dual:** Generador de texto para WhatsApp con formato estructurado + vista de enlace rápido (*RelevoView*) para que cuidadores suplentes marquen tomas en tiempo real.

---

## Dependency Graph
`	ext
Phase 1: Project Scaffolding & Types
  │
  ├── Phase 2: Medication Engine & Daily Timeline (Core Slice 1)
  │     │
  │     ├── Phase 3: Notifications & WhatsApp Delegation (Slice 2)
  │     │
  │     └── Phase 4: Vitals Tracking & 3-Day Campaigns (Slice 3)
  │           │
  │           ├── Phase 5: Studies, Appointments & Doctor Summary (Slice 4)
  │           │
  │           └── Phase 6: Family Expenses & Cost Splitter (Slice 5)
  │                 │
  └─────────────────┴── Phase 7: PWA Polish & End-to-End Verification
`

---

## Task Plan by Phases

### Phase 1: Foundation, Design System & Types
- [ ] **Task 1:** Scaffolding del proyecto React + Vite + TypeScript + PWA + Design Tokens
- [ ] **Task 2:** Modelos de datos TypeScript, almacenamiento local reactivo y datos de ejemplo iniciales (*seed*)

#### 🔍 Checkpoint 1: Foundation
- [ ] Proyecto compila limpiamente (
pm run build).
- [ ] Capa de persistencia local guarda y recupera estados sin errores.

---

### Phase 2: Core Patient & Complex Medication Engine (Vertical Slice 1)
- [ ] **Task 3:** Motor matemático de frecuencias (requencyEngine.ts) con soporte de fracciones, días alternos y cada $ días
- [ ] **Task 4:** Selector de perfil de paciente (Crónico / Adulto Mayor vs Temporal / Familiar) y navegación
- [ ] **Task 5:** Línea de tiempo diaria antierror, badges de fracciones (1/2 tableta) y checkbox de confirmación de toma
- [ ] **Task 6:** Formulario de alta de medicamentos complejos y control de inventario/stock con semáforo

#### 🔍 Checkpoint 2: Medication Engine
- [ ] Pautas de prueba verificadas: Metformina (1 mañana, 0.5 noche), Rivaroxabán (días alternos), Aspirina (cada 4 días), Cilostazol (diario).
- [ ] Confirmar una toma descuenta automáticamente del inventario.

---

### Phase 3: Notifications & WhatsApp Delegation (Vertical Slice 2)
- [ ] **Task 7:** Servicio de Notificaciones Web nativas de escritorio/móvil con recordatorios
- [ ] **Task 8:** Generador de mensaje estructurado para WhatsApp y pantalla de enlace rápido (*RelevoView*)

#### 🔍 Checkpoint 3: Delegation
- [ ] Notificación de escritorio dispara alerta visual y sonora al llegar la hora.
- [ ] Botón de WhatsApp abre mensaje preformateado con datos del día y enlace.

---

### Phase 4: Vital Signs & Medical Campaigns (Vertical Slice 3)
- [ ] **Task 9:** Formulario y bitácora de Glucosa (ayunas/postprandial), Presión Arterial y SpO2
- [ ] **Task 10:** Modo Campañas de Monitoreo (ej. 3 días continuos) con gráficas de evolución y estadísticas promedio

#### 🔍 Checkpoint 4: Vitals
- [ ] Registro de signos completado en menos de 5 segundos.
- [ ] Gráficas de tendencia y semáforos de presión/glucosa funcionando.

---

### Phase 5: Studies, Appointments & Doctor Summary (Vertical Slice 4)
- [ ] **Task 11:** Expediente de estudios de laboratorio con subida y visualizador de archivos (PDF/fotos)
- [ ] **Task 12:** Agenda de citas con especialistas y modo Resumen para el Médico de 1 página lista para imprimir

#### 🔍 Checkpoint 5: Medical Records
- [ ] Archivos PDF y fotos se previsualizan correctamente en modales.
- [ ] La ficha para el médico condensa medicamentos, signos y estudios en 1 sola hoja limpia.

---

### Phase 6: Family Expense Tracking & Split Calculator (Vertical Slice 5)
- [ ] **Task 13:** Registro de gastos médicos (fármacos, consultas, estudios) y balance mensual
- [ ] **Task 14:** Calculadora familiar de división de costos (partes iguales o porcentajes) con desglose de deuda

#### 🔍 Checkpoint 6: Expenses
- [ ] Ingreso de compras de farmacia suma al total mensual y calcula el aporte exacto de cada familiar.

---

### Phase 7: PWA Polish & End-to-End Verification
- [ ] **Task 15:** Banner de instalación PWA, soporte offline completo y pruebas de responsividad

#### 🔍 Checkpoint 7: Final
- [ ] Instalación verificada en escritorio y móvil.
- [ ] Cero errores de consola, experiencia ágil y fluida.

---

## Risks and Mitigations
| Riesgo | Impacto | Mitigación |
| :--- | :--- | :--- |
| Fechas y zonas horarias desincronizan días alternos | Alto | Uso de fechas ISO en UTC local y cálculo matemático de días transcurridos desde echaInicio. |
| Cuidador cierra el navegador y pierde alertas | Medio | Service Worker PWA y recordatorio visual de tomas pendientes al abrir la app. |
| Suplente sin acceso a internet o app | Medio | El mensaje de WhatsApp incluye todo el texto en claro sin obligar a usar la app. |
