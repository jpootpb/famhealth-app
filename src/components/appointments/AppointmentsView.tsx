import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MedicalAppointment } from '../../types';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  Circle,
  MapPin,
  Clock,
  User,
  X,
  Stethoscope,
  AlertCircle
} from 'lucide-react';

export const AppointmentsView: React.FC = () => {
  const { activePatient, appointments, addAppointment, toggleAppointmentCompleted } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('Geriatrics & Internal Medicine');
  const [dateTime, setDateTime] = useState(new Date().toISOString().slice(0, 16));
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  if (!activePatient) {
    return (
      <div className="card text-center" style={{ padding: '3rem 1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Please select a patient profile to manage medical appointments.</p>
      </div>
    );
  }

  const patientAppointments = appointments.filter(a => a.patientId === activePatient.id);
  const upcomingAppointments = patientAppointments
    .filter(a => !a.isCompleted)
    .sort((a, b) => a.dateTime.localeCompare(b.dateTime));

  const completedAppointments = patientAppointments
    .filter(a => a.isCompleted)
    .sort((a, b) => b.dateTime.localeCompare(a.dateTime));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName.trim()) return;

    addAppointment({
      patientId: activePatient.id,
      doctorName: doctorName.trim(),
      specialty: specialty.trim(),
      dateTime,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      isCompleted: false
    });

    setDoctorName('');
    setLocation('');
    setNotes('');
    setIsModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
            {activePatient.name}'s Medical Appointments Agenda
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Schedule consultations, specialist checkups, and prep instructions.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Schedule New Appointment
        </button>
      </div>

      {/* Upcoming Consultations */}
      <div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Clock size={16} color="var(--primary)" /> Upcoming Consultations ({upcomingAppointments.length})
        </h3>

        {upcomingAppointments.length === 0 ? (
          <div className="card text-center" style={{ padding: '2.5rem 1.5rem', marginBottom: '1.5rem' }}>
            <CalendarDays size={38} color="var(--primary)" style={{ opacity: 0.5, margin: '0 auto 0.75rem' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
              No upcoming appointments scheduled.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {upcomingAppointments.map(app => {
              const formattedDate = new Date(app.dateTime).toLocaleDateString('es-MX', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={app.id}
                  className="card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.25rem',
                    borderLeft: '4px solid var(--primary)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <button
                      onClick={() => toggleAppointmentCompleted(app.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        marginTop: '0.25rem'
                      }}
                      title="Mark as completed"
                    >
                      <Circle size={26} color="var(--border-color)" />
                    </button>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                          {app.doctorName}
                        </strong>
                        <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                          <Stethoscope size={12} /> {app.specialty}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'var(--primary-hover)', fontWeight: 700, marginTop: '0.25rem' }}>
                        <CalendarDays size={14} /> {formattedDate}
                      </div>

                      {app.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          <MapPin size={14} /> {app.location}
                        </div>
                      )}

                      {app.notes && (
                        <div
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8125rem',
                            color: 'var(--text-secondary)',
                            marginTop: '0.5rem'
                          }}
                        >
                          <strong>Prep Notes:</strong> {app.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => toggleAppointmentCompleted(app.id)}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Mark Done
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Appointments Archive */}
      {completedAppointments.length > 0 && (
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Completed Appointments ({completedAppointments.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {completedAppointments.map(app => (
              <div
                key={app.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  opacity: 0.85
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={16} color="var(--success)" />
                    <span style={{ textDecoration: 'line-through', fontWeight: 600 }}>{app.doctorName}</span>
                    <span className="badge" style={{ fontSize: '0.7rem' }}>{app.specialty}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.dateTime.replace('T', ' ')}</span>
                </div>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => toggleAppointmentCompleted(app.id)}
                  style={{ fontSize: '0.75rem' }}
                >
                  Reopen
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Appointment Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CalendarDays size={22} color="var(--primary)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Schedule Medical Appointment</h2>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Doctor / Specialist Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Dr. Alejandro Hernandez"
                  value={doctorName}
                  onChange={e => setDoctorName(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Medical Specialty</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Geriatrics, Cardiology, Ophthalmology"
                    value={specialty}
                    onChange={e => setSpecialty(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Date & Time</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={dateTime}
                    onChange={e => setDateTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Clinic / Hospital Location</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Clinica Merida, Suite 402"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Preparation Notes & Instructions</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. 8 hours fasting for blood draw, bring latest glucose log"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Schedule Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
