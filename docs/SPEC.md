# Spec: SaludFamiliar PWA (Centro de Control Clínico y Financiero)

## 1. Objective
Construir una Aplicación Web Progresiva (PWA) de alto rendimiento e intuitiva en React + TypeScript para el cuidado del adulto mayor y el núcleo familiar. Resuelve la gestión de esquemas de medicación complejos, el seguimiento de signos vitales (glucosa, presión, oxigenación), la delegación a WhatsApp con enlace interactivo, el archivo de estudios médicos digitales y la división de gastos familiares.

### User Stories & Criterios de Aceptación
1. **Pautas de Medicación Complejas:**
   - Como cuidador, puedo programar un medicamento diario con dosis distintas (ej. 1 tableta a las 8:00 AM y 0.5 tableta a las 8:00 PM).
   - Puedo programar frecuencias de días alternos (ej. Rivaroxabán un día sí, un día no) y cada N días (ej. Aspirina cada 4 días).
   - Puedo registrar tratamientos agudos con fecha límite (ej. antibióticos cada 8 horas por 5 días) con cuenta regresiva.
2. **Checklist Diario & Notificaciones en PC/Móvil:**
   - La pantalla principal muestra las tomas del día agrupadas por horarios.
   - Marcar una toma como Tomada descuenta automáticamente el stock y registra fecha/hora exacta.
   - El cuidador recibe una notificación de escritorio en el navegador cuando llega la hora de una toma.
3. **Delegación por WhatsApp:**
   - Con 1 clic, genera el texto formateado con emojis para enviar por WhatsApp.
   - Incluye un enlace de pase de día rápido para que el suplente marque tomas desde su celular.
4. **Inventario & Alerta de Reabastecimiento:**
   - Semáforo de stock (Verde: >7 días, Amarillo: <=3 días, Rojo: 0 días).
   - Alerta visual para comprar medicamentos antes de que se agoten.
5. **Bitácora de Signos Vitales & Campañas:**
   - Registro rápido de Glucosa (ayunas/postprandial), Presión Arterial (sistólica/diastólica/pulso) y SpO2.
   - Modo campaña médica (ej. Control de 3 días solicitado por el Dr.) con gráficas y exportación limpia para la consulta.
6. **Estudios Médicos Digitales & Citas:**
   - Subida y visualización de PDFs y fotos de análisis clínicos.
   - Agenda de citas médicas con fecha, especialista y notas.
7. **Control de Gastos & División Familiar:**
   - Registro de costos de medicamentos, consultas y estudios.
   - Desglose mensual y cálculo de la aportación por familiar.

---

## 2. Tech Stack
- **Frontend:** React 18 / 19, TypeScript, Vite.
- **Iconografía & UI:** Lucide-React, Vanilla CSS Tokens + Modern Tailwind / Clean UI Components (High contrast, accessible, responsive).
- **PWA & Offline:** ite-plugin-pwa (Service Worker, Web App Manifest, Cache First & Network Fallback).
- **Base de Datos & Almacenamiento:** Firebase Firestore (tiempo real y persistencia offline), Firebase Auth, Firebase Storage (PDFs y fotos de estudios). Soporte dual con almacenamiento local (LocalStorage / IndexedDB) automático.
- **Gráficas:** Chart.js / Recharts (para evolución de glucosa y presión arterial).

---

## 3. Commands
`ash
# Instalación de dependencias
npm install

# Servidor de desarrollo local
npm run dev

# Compilación de producción y PWA
npm run build

# Previsualización del bundle de producción
npm run preview

# Validación de tipos y linter
npm run lint
`

---

## 4. Project Structure
`	ext
Z:\App Salud/
├── docs/
│   ├── SPEC.md                           # Especificación técnica
│   ├── salud_familiar_spec.md            # Modelo de datos y arquitectura
│   └── salud_familiar_idea_refine.md     # Refinamiento y alcance MVP
├── tasks/
│   ├── plan.md                           # Plan de arquitectura e implementación
│   └── todo.md                           # Lista de tareas granulares
├── public/
│   ├── favicon.svg
│   ├── manifest.json                     # PWA Manifest
│   └── icons/                            # Iconos para PWA Android/iOS/PC
├── src/
│   ├── components/                       # Componentes modulares
│   │   ├── common/                       # Botones, Modales, Inputs, Tarjetas
│   │   ├── layout/                       # Header, Sidebar, BottomNav, Selector de Perfil
│   │   ├── medications/                  # Formulario de pautas complejas, Checklist, Stock
│   │   ├── vitals/                       # Registro de Glucosa, Presión, SpO2, Gráficas
│   │   ├── studies/                      # Subida y visualizador de PDFs/fotos
│   │   ├── appointments/                 # Agenda de citas médicas
│   │   ├── expenses/                     # División de gastos y resumen mensual
│   │   └── summary/                      # Modo Resumen para el Médico (1 Clic)
│   ├── context/                          # Estado global (PacienteContext, AuthContext, NotificationContext)
│   ├── hooks/                            # Hooks personalizados (useMedications, useVitals, useExpenses, usePWA)
│   ├── lib/                              # Servicios (firebase.ts, localStore.ts, notifications.ts, whatsapp.ts)
│   ├── types/                            # Definiciones de TypeScript (Patient, Medication, Vital, Study, Expense)
│   ├── utils/                            # Motor de cálculo de frecuencias y fechas (frequencyEngine.ts, formatters.ts)
│   ├── App.tsx                           # Enrutamiento y vista principal
│   ├── index.css                         # Tokens de diseño, estilos globales y temas
│   └── main.tsx                          # Punto de entrada
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
`

---

## 5. Code Style & Convenciones
- **TypeScript estricto:** Tipos explícitos para todas las entidades (Medication, DoseSchedule, VitalSign).
- **Nombres en español para dominio de negocio:** paciente, medicamento, 	oma, signoVital, gasto.
- **Componentes funcionales puros:** Hooks desacoplados de la UI.
- **Ejemplo del Motor de Frecuencias (src/utils/frequencyEngine.ts):**

`	ypescript
export interface ReglaFrecuencia {
  tipo: 'diaria_fija' | 'dias_alternos' | 'cada_n_dias' | 'por_horas_temporal';
  horas?: string[];          // ej. ['08:00', '20:00']
  dosis?: number[];          // ej. [1, 0.5]
  intervaloDias?: number;    // ej. 4 para cada 4 días
  intervaloHoras?: number;   // ej. 8 para cada 8 horas
  fechaInicio: string;       // YYYY-MM-DD
  fechaFin?: string;         // YYYY-MM-DD para tratamientos temporales
}

export function tocaTomaHoy(regla: ReglaFrecuencia, fechaEvaluacion: Date = new Date()): boolean {
  const inicio = new Date(regla.fechaInicio);
  const diffDias = Math.floor((fechaEvaluacion.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDias < 0) return false;
  if (regla.fechaFin && fechaEvaluacion > new Date(regla.fechaFin)) return false;

  switch (regla.tipo) {
    case 'diaria_fija':
      return true;
    case 'dias_alternos':
      return diffDias % 2 === 0;
    case 'cada_n_dias':
      return diffDias % (regla.intervaloDias || 1) === 0;
    case 'por_horas_temporal':
      return true;
    default:
      return true;
  }
}
`

---

## 6. Testing & Quality Strategy
- Pruebas unitarias para el motor de cálculo de frecuencias y algoritmos de división de gastos.
- Verificación en navegadores de escritorio (Chrome, Edge) para Notificaciones y PWA.
- Verificación responsiva en resoluciones móviles (375px a 768px) y escritorio (1280px+).

---

## 7. Boundaries (Límites de Desarrollo)
- **Siempre:**
  - Validar los inputs numéricos (dosis > 0, glucosa entre 20 y 600 mg/dL, presión válida).
  - Manejar persistencia local para que la app funcione aún sin conexión a internet.
  - Asegurar contraste accesible y tipografía legible para cuidadores en PC y móvil.
- **Consultar primero:**
  - Cambios mayores en la estructura del modelo de datos de Firebase.
  - Inclusión de librerías externas pesadas.
- **Nunca:**
  - Almacenar credenciales privadas en el repositorio.
  - Perder información al recargar la página (autoguardado continuo).

---

## 8. Success Criteria
- [x] La app se instala como PWA en Windows y celulares.
- [x] Un medicamento con pauta 1 tableta 8am y 0.5 tableta 8pm aparece con las dosis correctas en el checklist.
- [x] Medicamentos de días alternos y cada 4 días solo se activan en su fecha correspondiente.
- [x] El botón de WhatsApp genera el texto del día con 1 solo clic.
- [x] El registro de Glucosa y Presión permite visualización clara por periodos.
- [x] El módulo de gastos calcula automáticamente la división exacta por familiar.
- [x] El modo Resumen para el Médico presenta una ficha clínica limpia de 1 página.
