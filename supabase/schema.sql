-- ==============================================================================
-- FamHealth (Salud Familiar) - PostgreSQL Cloud Database Schema for Supabase
-- ==============================================================================

-- 1. Family Circles (Núcleos y Espacios Familiares / Personales)
CREATE TABLE IF NOT EXISTS family_circles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    is_personal_space BOOLEAN DEFAULT FALSE,
    owner_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Patients (Perfiles de Pacientes: Papá, Mamá, José Manuel Autocuidado)
CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    family_id TEXT REFERENCES family_circles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER,
    type TEXT NOT NULL CHECK (type IN ('chronic', 'temporary', 'preventive')),
    primary_diagnosis TEXT,
    treatment_start_date DATE,
    duration_days INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Medications (Botiquín, Frecuencias, Stock, Lealtad y Donaciones)
CREATE TABLE IF NOT EXISTS medications (
    id TEXT PRIMARY KEY,
    family_id TEXT REFERENCES family_circles(id) ON DELETE CASCADE,
    patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    presentation TEXT NOT NULL,
    indication TEXT,
    laboratory TEXT,
    image_url TEXT,
    frequency JSONB NOT NULL, -- { type, doseSlots, startDate, endDate, intervalDays, intervalHours }
    current_stock NUMERIC NOT NULL DEFAULT 0,
    minimum_stock_alert NUMERIC NOT NULL DEFAULT 3,
    unit_cost NUMERIC,
    is_imss_covered BOOLEAN DEFAULT FALSE,
    source TEXT,
    preferred_store TEXT,
    purchase_notes TEXT,
    loyalty_promo JSONB, -- { enabled, storeName, requiredPurchases, currentPurchased, rewardDescription }
    donation_source JSONB, -- { fromPatientName, donorType, date, notes }
    expiration_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Dose Logs (Historial de Tomas y Cumplimiento con Firma de Cuidador)
CREATE TABLE IF NOT EXISTS dose_logs (
    id TEXT PRIMARY KEY,
    family_id TEXT REFERENCES family_circles(id) ON DELETE CASCADE,
    patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    medication_id TEXT REFERENCES medications(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    scheduled_time TEXT NOT NULL,
    actual_taken_time TEXT,
    dose NUMERIC NOT NULL,
    taken BOOLEAN DEFAULT TRUE,
    administered_by TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Vital Signs (Monitoreo de Signos Vitales: Glucosa, Presión, Peso)
CREATE TABLE IF NOT EXISTS vital_signs (
    id TEXT PRIMARY KEY,
    family_id TEXT REFERENCES family_circles(id) ON DELETE CASCADE,
    patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('glucose', 'blood_pressure', 'spo2', 'weight', 'heart_rate')),
    value NUMERIC NOT NULL,
    secondary_value NUMERIC,
    timing TEXT CHECK (timing IN ('fasting', 'postprandial', 'random', 'before_sleep')),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Medical Appointments (Consultas Médicas, Recomendaciones Verbales y Google Maps)
CREATE TABLE IF NOT EXISTS medical_appointments (
    id TEXT PRIMARY KEY,
    family_id TEXT REFERENCES family_circles(id) ON DELETE CASCADE,
    patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    doctor_name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    google_maps_url TEXT,
    doctor_phone TEXT,
    notes TEXT,
    verbal_recommendations TEXT[],
    prescription_url TEXT,
    prescription_file_type TEXT CHECK (prescription_file_type IN ('image', 'pdf')),
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Medical Studies (Estudios de Laboratorio, Imagenología y Portales PACS DICOM 3D)
CREATE TABLE IF NOT EXISTS medical_studies (
    id TEXT PRIMARY KEY,
    family_id TEXT REFERENCES family_circles(id) ON DELETE CASCADE,
    patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('blood_test', 'imaging', 'cardiology', 'pathology', 'nutrition_plan', 'other')),
    date DATE NOT NULL,
    laboratory TEXT,
    results_summary TEXT,
    file_url TEXT,
    file_type TEXT CHECK (file_type IN ('pdf', 'image')),
    viewer_url TEXT,
    report_url TEXT,
    access_credentials TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Health Expenses (Gastos Médicos y Cuentas Claras entre Familiares)
CREATE TABLE IF NOT EXISTS health_expenses (
    id TEXT PRIMARY KEY,
    family_id TEXT REFERENCES family_circles(id) ON DELETE CASCADE,
    patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    concept TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('medication', 'lab_study', 'doctor_appointment', 'supplies', 'other')),
    amount NUMERIC NOT NULL,
    date DATE NOT NULL,
    paid_by TEXT NOT NULL,
    store TEXT,
    medication_id TEXT,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Family Members & Caregiver Shifts (Cuidadores y Porcentajes de Gasto)
CREATE TABLE IF NOT EXISTS family_members (
    id TEXT PRIMARY KEY,
    family_id TEXT REFERENCES family_circles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship TEXT,
    phone TEXT,
    shift TEXT CHECK (shift IN ('morning', 'evening', 'night', 'full_day', 'weekend')),
    is_default_caregiver BOOLEAN DEFAULT FALSE,
    split_percentage NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- Habilitar Políticas de Seguridad de Fila (Row Level Security - RLS)
-- ==============================================================================
ALTER TABLE family_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dose_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para clave anónima / autenticada
CREATE POLICY "Permitir acceso público y autenticado a family_circles" ON family_circles FOR ALL USING (true);
CREATE POLICY "Permitir acceso público y autenticado a patients" ON patients FOR ALL USING (true);
CREATE POLICY "Permitir acceso público y autenticado a medications" ON medications FOR ALL USING (true);
CREATE POLICY "Permitir acceso público y autenticado a dose_logs" ON dose_logs FOR ALL USING (true);
CREATE POLICY "Permitir acceso público y autenticado a vital_signs" ON vital_signs FOR ALL USING (true);
CREATE POLICY "Permitir acceso público y autenticado a medical_appointments" ON medical_appointments FOR ALL USING (true);
CREATE POLICY "Permitir acceso público y autenticado a medical_studies" ON medical_studies FOR ALL USING (true);
CREATE POLICY "Permitir acceso público y autenticado a health_expenses" ON health_expenses FOR ALL USING (true);
CREATE POLICY "Permitir acceso público y autenticado a family_members" ON family_members FOR ALL USING (true);

-- ==============================================================================
-- Habilitar Sincronización en Tiempo Real (Realtime WebSockets)
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE dose_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE vital_signs;
ALTER PUBLICATION supabase_realtime ADD TABLE medications;
ALTER PUBLICATION supabase_realtime ADD TABLE medical_appointments;
