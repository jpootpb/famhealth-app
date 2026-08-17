# SaludFamiliar PWA: Centro de Control Clínico y Financiero para el Cuidado Familiar

## Problem Statement (Cómo Podríamos)
> ¿Cómo podríamos eliminar el riesgo de error en tratamientos médicos complejos de un adulto mayor y familiares, garantizando el cumplimiento estricto de dosis y frecuencias, registrando signos vitales sin libretas de papel y facilitando la delegación y división de gastos familiares con cero fricción?

---

## Dirección Recomendada: "El Copiloto Clínico del Cuidador"

La solución no es una base de datos médica aburrida, sino un **asistente activo y visual centrado en la seguridad del paciente y la tranquilidad mental del cuidador**. 

### Pilares Clave de la Experiencia:
1. **Línea de Tiempo Antierror con Frecuencias Inteligentes:**
   - Visualización por bloques del día (Mañana, Tarde, Noche) con distintivos visuales claros para fracciones (ej. *"1/2 pastilla"* resaltado en amarillo) y frecuencias especiales (*"Día alterno / Toca hoy"*).
   - Confirmación de toma en 1 toque que descuenta automáticamente del inventario y registra la hora exacta.
2. **Delegación Híbrida por WhatsApp (Texto + Enlace Mágico):**
   - Si el cuidador no está en casa, genera con un clic un mensaje claro para WhatsApp con emojis, pero además incluye un enlace rápido de pase temporal para que el familiar suplente marque las tomas desde su celular y se actualice al instante en la computadora del cuidador.
3. **Modo "Resumen Médico en 1 Clic":**
   - Vista de ficha clínica limpia que compila en una sola pantalla o PDF los medicamentos activos con dosis, las gráficas de glucosa/presión de los últimos días y los estudios recientes para mostrárselo al doctor en la consulta en 10 segundos.
4. **Campañas de Signos Vitales (Glucosa / Presión / SpO2):**
   - Permite crear retos o seguimientos temporales indicados por el médico (ej. *"Monitoreo de glucosa por 3 días"* o *"Control de presión semanal"*), alertando cuándo toca la siguiente medición.
5. **División Transparente de Gastos Familiares:**
   - Registro de tickets de farmacia, estudios y consultas con cálculo automático del balance mensual de aportaciones por familiar.

---

## Supuestos Clave a Validar
- [ ] **Supuesto 1 (Frecuencias complejas):** La interfaz para dar de alta reglas de repetición (días alternos, cada 4 días, fracciones de pastilla) es tan intuitiva que el cuidador puede configurarla en menos de 1 minuto sin confundirse.
- [ ] **Supuesto 2 (Notificaciones en PC):** El cuidador mantiene la pestaña abierta o la app instalada en segundo plano en su computadora de trabajo para recibir las alertas sonoras y de escritorio a tiempo.
- [ ] **Supuesto 3 (Adopción de suplentes):** Los familiares suplentes prefieren recibir la lista por WhatsApp y usar el enlace rápido antes que depender de una libreta física.

---

## Alcance MVP (Fase 1)

### ✅ Lo que SÍ entra en el MVP:
1. **Perfiles de Paciente:** Soporte para perfil crónico (Adulto Mayor) y perfiles temporales con fecha de fin (ej. Familiar con infección/antibióticos).
2. **Motor de Medicación Compleja:**
   - Frecuencias fijas con dosis variables (mañana 1, noche 0.5).
   - Intervalos de días (cada 4 días).
   - Días alternos (un día sí, un día no).
   - Intervalo horario para tratamientos agudos (cada 8 hrs por 5 días).
3. **Checklist Diario & Notificaciones Web:** Panel interactivo del día con alertas de escritorio.
4. **Delegación WhatsApp & Enlace de Relevo:** Exportación a texto formateado y enlace público de lectura/marcado para el día en curso.
5. **Control de Inventario & Alerta de Stock:** Conteo de pastillas restantes y semáforo de reabastecimiento (Verde / Amarillo / Rojo).
6. **Bitácora de Signos Vitales & Campañas:** Registro de Glucosa (ayunas/postprandial), Presión y Oxigenación con historial visual.
7. **Estudios & Citas:** Subida de archivos (PDF/fotos) de laboratorios y agenda de citas con especialistas.
8. **Control de Gastos & Repartición:** Registro de compras y calculadora de división mensual entre familiares.
9. **Modo Resumen para el Médico:** Ficha consolidada lista para imprimir o compartir al doctor.

---

## 🚫 Not Doing (Lo que NO haremos y por qué)
- **NO integración con hardware Bluetooth:** El emparejamiento con glucómetros o tensiómetros por Bluetooth suele fallar entre marcas y agrega enorme complejidad; el registro manual con teclado numérico toma solo 3 segundos y es 100% confiable.
- **NO pasarela de pagos / cobros reales dentro de la app:** La app calcula los balances y porcentajes de cada familiar; las transferencias de dinero se realizan por las vías bancarias habituales (SPEI / efectivo) sin comisiones ni intermediarios.
- **NO expediente clínico hospitalario complejo (HL7/FHIR):** No buscamos competir con un software de hospital, sino resolver la vida cotidiana del hogar y del cuidador familiar.

---

## Preguntas Abiertas / Siguientes Pasos
- ¿Prefieres que los datos comiencen funcionando de inmediato en modo local (LocalStorage/IndexedDB) y luego enlazar las credenciales de Firebase, o configuramos el proyecto con Firebase desde el primer commit?
