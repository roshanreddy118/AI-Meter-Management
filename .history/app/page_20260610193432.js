'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [readings, setReadings] = useState([]);
  const [settings, setSettings] = useState({ bescom_rate: 8.5 });
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);

  // Modals
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showMeterModal, setShowMeterModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Forms
  const [propertyForm, setPropertyForm] = useState({ name: '', address: '' });
  const [meterForm, setMeterForm] = useState({
    reading_date: new Date().toISOString().split('T')[0],
    meter_reading: '',
  });
  const [settingsForm, setSettingsForm] = useState({ bescom_rate: 8.5 });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch('/api/properties');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProperties(data || []);
      setDbError(false);
    } catch (err) {
      console.error('Error:', err);
      setDbError(true);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadSettings() {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setSettingsForm({ bescom_rate: data.bescom_rate });
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  }

  async function loadReadings(propertyId) {
    try {
      const res = await fetch(`/api/readings?propertyId=${propertyId}`);
      if (res.ok) {
        const data = await res.json();
        setReadings(data || []);
      }
    } catch (err) {
      console.error('Error loading readings:', err);
      setReadings([]);
    }
  }

  async function addProperty(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propertyForm),
      });
      if (res.ok) {
        setPropertyForm({ name: '', address: '' });
        setShowPropertyModal(false);
        loadData();
      }
    } catch (err) {
      console.error('Error adding property:', err);
      alert('Failed to add property');
    }
  }

  async function deleteProperty() {
    if (!confirm('Delete this property and all readings?')) return;
    try {
      const res = await fetch(`/api/properties?id=${selectedPropertyId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setShowDetailsModal(false);
        loadData();
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to delete');
    }
  }

  async function addReading(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          readingDate: meterForm.reading_date,
          meterReading: parseFloat(meterForm.meter_reading),
          photoUrl: '',
        }),
      });
      if (res.ok) {
        setMeterForm({
          reading_date: new Date().toISOString().split('T')[0],
          meter_reading: '',
        });
        setShowMeterModal(false);
        loadReadings(selectedPropertyId);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to add reading');
    }
  }

  async function updatePaymentStatus(readingId, status) {
    try {
      const res = await fetch(`/api/readings?id=${readingId}&action=payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: status }),
      });
      if (res.ok) {
        loadReadings(selectedPropertyId);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  }

  async function deleteReading(readingId) {
    if (!confirm('Delete this reading?')) return;
    try {
      const res = await fetch(`/api/readings?id=${readingId}&action=delete`, {
        method: 'PATCH',
      });
      if (res.ok) {
        loadReadings(selectedPropertyId);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  }

  async function updateSettings(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bescomRate: parseFloat(settingsForm.bescom_rate) }),
      });
      if (res.ok) {
        setShowSettingsModal(false);
        loadSettings();
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to update');
    }
  }

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

  return (
    <div className="container">
      <header>
        <h1>📊 Meter Tracker</h1>
        <div className="header-actions">
          <button className="btn btn-settings" onClick={() => { loadSettings(); setShowSettingsModal(true); }}>
            ⚙️ Settings
          </button>
          <button className="btn btn-primary" onClick={() => setShowPropertyModal(true)}>
            + Add Rent House
          </button>
        </div>
      </header>

      <main>
        {dbError && (
          <div className="alert-warning">
            <strong>⚠️ Database Error</strong>
            <br/>
            Visit: <code>{typeof window !== 'undefined' ? window.location.origin : ''}/api/init</code> then refresh.
          </div>
        )}
        <div className="properties-grid">
          {loading ? (
            <p className="loading">Loading...</p>
          ) : dbError ? (
            <p className="loading">Initialize database at /api/init</p>
          ) : properties.length === 0 ? (
            <p className="loading">No rent houses. Click "+ Add Rent House"</p>
          ) : (
            properties.map((prop) => (
              <div
                key={prop.id}
                className="property-card"
                onClick={() => {
                  setSelectedPropertyId(prop.id);
                  loadReadings(prop.id);
                  setShowDetailsModal(true);
                }}
              >
                <h3>{prop.name}</h3>
                <p>Last: {prop.last_reading_date || 'No data'}</p>
                <p>Value: {prop.last_reading || '-'}</p>
                <span className={`status ${prop.last_payment_status || 'pending'}`}>
                  {prop.last_payment_status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                </span>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Add Property */}
      <div id="propertyModal" className={`modal ${showPropertyModal ? 'show' : ''}`} onClick={() => setShowPropertyModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <span className="close" onClick={() => setShowPropertyModal(false)}>&times;</span>
          <h2>Add Property</h2>
          <form onSubmit={addProperty}>
            <input
              type="text"
              placeholder="Name (House 1, Flat A, etc)"
              value={propertyForm.name}
              onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Address (optional)"
              value={propertyForm.address}
              onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
            />
            <button type="submit" className="btn btn-primary">Add</button>
          </form>
        </div>
      </div>

      {/* Add Reading */}
      <div id="meterModal" className={`modal ${showMeterModal ? 'show' : ''}`} onClick={() => setShowMeterModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <span className="close" onClick={() => setShowMeterModal(false)}>&times;</span>
          <h2>Add Reading</h2>
          <form onSubmit={addReading}>
            <input
              type="date"
              value={meterForm.reading_date}
              onChange={(e) => setMeterForm({ ...meterForm, reading_date: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Meter reading"
              step="0.01"
              value={meterForm.meter_reading}
              onChange={(e) => setMeterForm({ ...meterForm, meter_reading: e.target.value })}
              required
            />
            <button type="submit" className="btn btn-primary">Save</button>
          </form>
        </div>
      </div>

      {/* Settings */}
      <div id="settingsModal" className={`modal ${showSettingsModal ? 'show' : ''}`} onClick={() => setShowSettingsModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <span className="close" onClick={() => setShowSettingsModal(false)}>&times;</span>
          <h2>Settings</h2>
          <form onSubmit={updateSettings}>
            <label>BESCOM Rate (per unit)</label>
            <input
              type="number"
              step="0.01"
              value={settingsForm.bescom_rate}
              onChange={(e) => setSettingsForm({ bescom_rate: e.target.value })}
              required
            />
            <button type="submit" className="btn btn-primary">Update</button>
          </form>
        </div>
      </div>

      {/* Property Details */}
      <div id="detailsModal" className={`modal ${showDetailsModal ? 'show' : ''}`} onClick={() => setShowDetailsModal(false)}>
        <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
          <span className="close" onClick={() => setShowDetailsModal(false)}>&times;</span>
          {selectedProperty && (
            <>
              <div className="details-header">
                <h2>{selectedProperty.name}</h2>
                <button className="btn btn-danger" onClick={deleteProperty}>Delete</button>
              </div>
              <button className="btn btn-primary" style={{ marginBottom: '20px' }} onClick={() => setShowMeterModal(true)}>
                + Add Reading
              </button>
              <table className="readings-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Reading</th>
                    <th>Units</th>
                    <th>Bill (₹)</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.length === 0 ? (
                    <tr><td colSpan="6" className="text-center">No readings</td></tr>
                  ) : (
                    readings.map((r) => (
                      <tr key={r.id}>
                        <td>{new Date(r.reading_date).toLocaleDateString()}</td>
                        <td>{parseFloat(r.meter_reading).toFixed(2)}</td>
                        <td>{parseFloat(r.units_consumed || 0).toFixed(2)}</td>
                        <td>₹{parseFloat(r.bill_amount || 0).toFixed(2)}</td>
                        <td>
                          <select
                            value={r.payment_status}
                            onChange={(e) => updatePaymentStatus(r.id, e.target.value)}
                            style={{ padding: '4px 8px' }}
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                          </select>
                        </td>
                        <td>
                          <button className="btn btn-danger btn-small" onClick={() => deleteReading(r.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
