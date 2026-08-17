# 🏥 SaludFamiliar / CuidadorApp PWA

> **Centro de Control Clínico y Financiero para el Cuidado Familiar**
> Aplicación Web Progresiva (PWA) instalable en PC y móviles para la gestión de tratamientos médicos complejos, control de signos vitales, archivo de estudios digitales y división de gastos familiares.

---

## 📚 Documentación del Proyecto

Los documentos de diseño, especificación y refinamiento generados durante la fase de planeación se encuentran en la carpeta [docs/](./docs/):

1. 📄 **[Especificación Técnica y Arquitectura (docs/salud_familiar_spec.md)](./docs/salud_familiar_spec.md)**
   - Modelo de datos completo (Pacientes, Medicamentos, Signos Vitales, Estudios, Gastos).
   - Motor de frecuencias de medicamentos (fracciones, días alternos, cada N días, tratamientos temporales).
   - Arquitectura PWA + Firebase en tiempo real con modo offline.

2. 💡 **[Refinamiento de Idea & Alcance MVP (docs/salud_familiar_idea_refine.md)](./docs/salud_familiar_idea_refine.md)**
   - Problem Statement (Cómo podríamos).
   - Pilares de experiencia: Línea de tiempo antierror, delegación rápida por WhatsApp con enlace mágico, modo resumen para el médico y campañas de signos vitales.
   - Alcance exacto del MVP y criterios de no-hacer.

---

## 🚀 Módulos Principales de la Aplicación

- 👤 **Multi-Perfil de Pacientes:** Soporte para perfiles crónicos (Adulto Mayor) y tratamientos agudos temporales (Familiares).
- 💊 **Motor de Medicación Inteligente:** Control de dosis fraccionadas (ej. 1/2 tableta de noche), esquemas de días alternos, cada 4 días o intervalos por horas.
- 🔔 **Notificaciones de Escritorio & Checklist Diario:** Alertas sonoras y visuales para el cuidador trabajando en la computadora.
- 📲 **Delegación WhatsApp en 1 Clic:** Envío de agenda del día con emojis y enlace interactivo para cuidadores suplentes.
- 📦 **Inventario y Semáforo de Stock:** Descuento automático de pastillas por toma y alertas de reabastecimiento.
- 🩺 **Bitácora de Signos Vitales (Glucosa, Presión, SpO2):** Gráficas y retos de monitoreo de 3 días solicitados por especialistas.
- 📑 **Expediente de Estudios con Adjuntos:** Carga y visualización de PDFs y fotos de análisis clínicos.
- 💰 **Finanzas y Repartición de Gastos:** Control de compras de farmacia, estudios y consultas con división de gastos mensuales entre familiares.
- 🖨️ **Modo Resumen para el Médico:** Ficha clínica de 1 página con medicamentos activos, signos y últimos estudios para la consulta.
