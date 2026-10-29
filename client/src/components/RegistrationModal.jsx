import React, { useState } from 'react';
import { XIcon, CheckIcon, TrophyIcon } from './Icons';
import { API_BASE } from '../config/api';

export default function RegistrationModal({ isOpen, onClose, tournaments = [], defaultTournamentId = null, onSuccess }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    district: 'Dhaka',
    club_name: '',
    category: 'Senior Men',
    tournament_id: defaultTournamentId || '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          setSubmitted(false);
          onClose();
        }, 2200);
      } else {
        setErrorMsg(data.message || 'Failed to submit registration');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error connecting to backend API (port 5000)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div className="badge badge-green" style={{ fontSize: '10px', marginBottom: '4px' }}>
              Official BCF Registration
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Register Player / Tournament Entry
            </h3>
          </div>

          <button 
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '6px', borderRadius: '50%', border: 'none' }}
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '30px 10px' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.2)',
                color: 'var(--accent-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}>
                <CheckIcon className="w-8 h-8" />
              </div>
              <h4 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Registration Submitted!
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Your entry has been recorded in the BCF MySQL database. Your official player ID card and ranking will be processed.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {errorMsg && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', fontSize: '13px' }}>
                  {errorMsg}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Full Name (as per NID / Birth Certificate) *
                </label>
                <input
                  type="text"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="e.g. Hafizur Rahman"
                  className="form-input"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@gmail.com"
                    className="form-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Phone Number (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+880 1711-000000"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    District *
                  </label>
                  <input
                    type="text"
                    name="district"
                    required
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="e.g. Dhaka, Chittagong, Sylhet"
                    className="form-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Affiliated Club / Academy
                  </label>
                  <input
                    type="text"
                    name="club_name"
                    value={formData.club_name}
                    onChange={handleChange}
                    placeholder="e.g. Dhaka Carrom Club"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="Senior Men">Senior Men</option>
                    <option value="Senior Women">Senior Women</option>
                    <option value="Junior Boys (U-18)">Junior Boys (U-18)</option>
                    <option value="Junior Girls (U-18)">Junior Girls (U-18)</option>
                    <option value="Veteran (50+)">Veteran (50+)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Target Tournament
                  </label>
                  <select
                    name="tournament_id"
                    value={formData.tournament_id}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="">-- General Federation Membership --</option>
                    {tournaments.map(t => (
                      <option key={t.id} value={t.id}>{t.title} ({t.edition})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Player Bio / Previous Tournament Accomplishments
                </label>
                <textarea
                  name="notes"
                  rows="3"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Mention previous district or division titles, white slams, etc."
                  className="form-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="flex items-center justify-end gap-3" style={{ marginTop: '12px' }}>
                <button type="button" onClick={onClose} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? 'Submitting to BCF Database...' : 'Submit Official Entry'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
