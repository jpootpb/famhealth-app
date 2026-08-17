# Project: SaludFamiliar PWA

## Tech Stack
- React 18 / 19 with TypeScript 5
- Vite + ite-plugin-pwa (Service Worker, Web Manifest, Offline-First)
- Lucide-React for crisp iconography
- Vanilla CSS Design System with CSS variables and responsive utility classes (High contrast, accessible, desktop & mobile optimized)
- LocalStorage / IndexedDB with reactive event bridge + Firebase Firestore / Storage schema compatibility

## Project Commands
- Dev: 
pm run dev
- Build: 
pm run build
- Preview: 
pm run preview
- Lint: 
pm run lint

## Project Map & Hierarchy
`	ext
src/
├── types/              # Strict domain types (Patient, Medication, DoseRecord, VitalSign, Study, Expense)
├── utils/              # Pure logic engines:
│   ├── frequencyEngine.ts  # Medication recurrence math (fractions, alternating days, every N days)
│   └── formatters.ts       # Dates, currency, clinical badges
├── lib/                # Infrastructure services:
│   ├── storage.ts          # Reactive LocalStorage / IndexedDB engine
│   ├── notifications.ts    # Web Notifications API (Desktop & Mobile alerts)
│   ├── whatsapp.ts         # Encoded WhatsApp sharing & magic link generator
│   └── demoData.ts         # Preloaded seed data (Chronic senior patient + Acute temporary patient)
├── context/            # Global state:
│   └── AppContext.tsx      # Patient switching, medications, tomas, vitals, studies, expenses
├── components/
│   ├── common/         # Buttons, Modals, Badges, Tabs, Notifications, PwaInstallPrompt
│   ├── layout/         # Header, Navigation, PatientSelector, QuickActions
│   ├── medications/    # DailyTimeline, MedicationCard, MedicationForm, InventoryView, ShareModal
│   ├── vitals/         # VitalsForm, VitalsHistory, VitalsCampaigns (3-day challenges), VitalsChart
│   ├── studies/        # StudiesManager, FileViewerModal (PDFs & Images)
│   ├── appointments/   # AppointmentsManager, AppointmentForm
│   ├── expenses/       # ExpenseManager, ExpenseForm, FamilySplitCalculator
│   ├── summary/        # DoctorSummaryReport (1-click clinical export for consultation)
│   └── delegation/     # RelevoView (Lightweight day pass for substitute caregivers)
├── App.tsx             # Root view with active tabs & patient routing
├── index.css           # Global design tokens, color variables, typography & layout utilities
└── main.tsx            # PWA registration and React DOM entrypoint
`

## Code Conventions
- **TypeScript strictness:** Explicit types for all props, state and domain entities. No ny.
- **Language:** Spanish for clinical and family domain names (paciente, medicamento, 	oma, signoVital, gasto, amiliar). English for technical plumbing (hooks, utils, lib, components).
- **State management:** Unidirectional data flow via AppContext and pure helper functions.
- **Accessibility & Contrast:** High legibility for caregivers in daylight or night shifts. Touch-friendly target sizes (min 44x44px).
- **Fractional Dose Distinction:** Visual emphasis on fractions (ej. 1/2 pastilla, 1/4 pastilla) to eliminate human error.

## Boundaries
- **Always:** Keep localStorage in sync so refreshing the page never loses data; validate clinical numbers (e.g. glucose 20-600, systolic 50-250); preserve responsive layout.
- **Ask First:** Adding heavy external UI libraries or changing fundamental data models.
- **Never:** Commit secret API keys or bypass TypeScript compiler checks.
