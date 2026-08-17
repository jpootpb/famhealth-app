# 📋 Software Engineering Task Plan: FamHealth PWA

> **Execution Methodology:**
> - **Strict Step-by-Step Gate:** No task starts until the previous task is tested, verified, and committed.
> - **Explicit Engineering Skills:** Every step clearly states its governing skills (TDD, Source-Driven Development, Frontend UI Engineering, Incremental Implementation).
> - **Language Standard:** Codebase artifacts, types, methods, and models are in English (`FamHealth`).

---

## 🗺️ Implementation Tasks Progress

### - [x] Task 1: Scaffolding, TypeScript, Design Tokens & Vitest Harness
- **Status:** `COMPLETED & VERIFIED` (Git Commit: `69ec57a`)
- **Skills Applied:**
  - 🛠️ `source-driven-development`: Vite + React 18 + TypeScript + Vitest setup.
  - 🧪 `test-driven-development`: `tests/sanity.test.ts` initial test harness.
- **Verification:** `npm test` passed (2/2) & `npm run build` generated clean bundle.

---

### - [x] Task 2: Medication Recurrence Calculation Engine with TDD
- **Status:** `COMPLETED & VERIFIED` (Git Commit: `db7704b`)
- **Skills Applied:**
  - 🧪 `test-driven-development`: `tests/frequencyEngine.test.ts` with 4 clinical test scenarios written before implementation.
  - 🛠️ `source-driven-development`: Deterministic UTC date math and strict TypeScript models in `src/utils/frequencyEngine.ts`.
- **Test Scenarios Verified:**
  1. Metformin daily with variable slots (1 pill at 8:00 AM, 0.5 pill at 8:00 PM).
  2. Rivaroxaban alternate days (`elapsedDays % 2 === 0`).
  3. Aspirin Protect every 4 days (`elapsedDays % 4 === 0`).
  4. Ciprofloxacin temporary antibiotic (every 12h for 7 days).
- **Verification:** 100% tests green.

---

### - [x] Task 3: Offline Persistence Layer & React Global State (`AppContext`)
- **Status:** `COMPLETED & VERIFIED` (Git Commit: `17b5edc`)
- **Skills Applied:**
  - 🛠️ `source-driven-development`: English domain models (`Patient`, `Medication`, `DoseLog`, `VitalSign`, `MonitoringCampaign`, `HealthExpense`), `LocalStore` Web Storage API wrapper in `src/lib/storage.ts`, and React Context provider in `src/context/AppContext.tsx`.
  - 🧪 `test-driven-development`: Storage unit test suite in `tests/storage.test.ts` (3/3 tests passed).
  - 🧱 `incremental-implementation`: Immutable state dispatchers and automatic reactive sync to localStorage.
- **Verification:** 9/9 tests passed across all suites & `npm run build` clean.

---

### - [x] Task 4: Header, Status Bar, and Multi-Profile Patient Switcher
- **Status:** `COMPLETED & VERIFIED` (Git Commit: `d79df0f`)
- **Skills Applied:**
  - 🎨 `frontend-ui-engineering`: Responsive header in `src/components/layout/Header.tsx` with branding, desktop notifications toggle, 1-click WhatsApp share and active patient badge.
  - 👥 `frontend-ui-engineering`: Accessible modal `src/components/layout/PatientSelector.tsx` for toggling between Chronic (Elderly) and Temporary (Acute) care profiles, with form to create new patients.
  - 🧪 `test-driven-development`: Unit test suite in `tests/headerPatientSelector.test.ts` (2/2 tests passed).
- **Verification:** 11/11 tests passed across 4 suites & `npm run build` clean in 1.09s.

---

### - [x] Task 5: Daily Medication Timeline with Fractional Pill Badges & Stock Deduction
- **Status:** `COMPLETED & VERIFIED` (Git Commit: `73f70f1`)
- **Skills Applied:**
  - 🎨 `frontend-ui-engineering`: High-legibility daily checklist in `src/components/timeline/DailyTimeline.tsx`, date picker (Today / Yesterday / Tomorrow), progress bar of completed doses, time-of-day slots (Morning, Afternoon, Evening, Night), and fractional badges (1 pill, 1/2 pill, 1/4 pill).
  - 🧱 `incremental-implementation`: 1-click dose confirmation with instant stock decrement and low-stock notification triggers.
  - 🧪 `test-driven-development`: Unit tests in `tests/dailyTimeline.test.ts` (2/2 tests passed).
- **Verification:** 13/13 tests passed across 5 suites & `npm run build` clean in 1.07s.

---

### - [x] Task 6: Medication Modal Form & Inventory Management with Stock Traffic Lights
- **Status:** `COMPLETED & VERIFIED`
- **Skills Applied:**
  - 🎨 `frontend-ui-engineering`: `MedicationList.tsx` inventory cabinet with stock summary counters (Safe / Low stock / Depleted) and rapid restock (+30 units / +15 units).
  - 🛠️ `source-driven-development`: `MedicationModal.tsx` form supporting all complex dosing rules (Daily fixed, Alternate days, Every N days, Temporary hourly with end dates or days duration).
  - 🧪 `test-driven-development`: Unit test suite in `tests/medicationInventory.test.ts` (2/2 tests passed).
- **Verification:** 15/15 tests passed across 6 suites & `npm run build` clean in 1.07s.

---

### - [ ] Task 7: Desktop Web Notifications & 1-Click WhatsApp Delegation
- **Status:** `NEXT IN QUEUE`
- **Skills Applied:**
  - 🛠️ `source-driven-development`: MDN Web Notifications API (`Notification.requestPermission`, `new Notification`).
  - 📱 `source-driven-development`: WHATWG URL encoding for universal WhatsApp delegation (`wa.me/?text=...`).

---

### - [ ] Task 8: Vitals Log (Glucose, BP, SpO2) & 3-Day Monitoring Campaigns
- **Status:** `PENDING`
- **Skills Applied:**
  - 🧪 `test-driven-development`: Average calculations and clinical range validations.
  - 🎨 `frontend-ui-engineering`: Fast input for Glucose (fasting/postprandial), Blood Pressure, Heart Rate, and SpO2 with 3-day challenge progress bar.

---

### - [ ] Task 9: Digital Lab Studies Archive & Appointments Schedule
- **Status:** `PENDING`
- **Skills Applied:**
  - 🛠️ `source-driven-development`: MDN File API & FileReader for safe local document previews (PDF/Images).
  - 🎨 `frontend-ui-engineering`: Studies gallery viewer and medical appointments agenda.

---

### - [ ] Task 10: 1-Click "Doctor Summary Report" Print View (`@media print`)
- **Status:** `PENDING`
- **Skills Applied:**
  - 🎨 `frontend-ui-engineering`: Single-page clinical summary optimized for consultation screens and physical printing.
  - 🛠️ `source-driven-development`: CSS Paged Media standards for high-density 1-page printouts.

---

### - [ ] Task 11: Expense Manager & Family Split Calculator
- **Status:** `PENDING`
- **Skills Applied:**
  - 🧪 `test-driven-development`: Settlement math algorithm (Sibling A owes Sibling B).
  - 🎨 `frontend-ui-engineering`: Monthly category breakdown (Pharmacy, Lab, Consultation) and WhatsApp settlement sharing.

---

### - [ ] Task 12: PWA Manifest, Service Worker Offline Verification & E2E Checks
- **Status:** `PENDING`
- **Skills Applied:**
  - 🛠️ `source-driven-development`: W3C Web App Manifest and Service Worker caching.
  - 🧱 `incremental-implementation`: Offline installation and audit on PC and mobile devices.