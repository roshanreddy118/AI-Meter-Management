'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [readings, setReadings] = useState([]);
  const [settings, setSettings] = useState({ bescom_rate: 8.5 });
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [databaseConnected, setDatabaseConnected] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Onboarding states
  const [numHouses, setNumHouses] = useState('');
  const [houseNames, setHouseNames] = useState([]);
  const [currentHouseIndex, setCurrentHouseIndex] = useState(0);
  const [currentHouseName, setCurrentHouseName] = useState('');

  // Modal states
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showMeterModal, setShowMeterModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Form states
  const [propertyForm, setPropertyForm] = useState({ name: '', address: '' });
  const [meterForm, setMeterForm] = useState({
    reading_date: new Date().toISOString().split('T')[0],
    meter_reading: '',
    photo_url: '',
  });
  const [settingsForm, setSettingsForm] = useState({ bescom_rate: 8.5 });

  // Load properties on mount
  useEffect(() => {
    fetchProperties();
    fetchSettings();
  }, []);

  async function fetchProperties() {
    try {
      const res = await fetch('/api/properties');
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      setProperties(Array.isArray(data) ? data : []);
      setDatabaseConnected(true);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]);
      setDatabaseConnected(false);
      setLoading(false);
    }
  }

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      setSettings(data);
      setSettingsForm({ bescom_rate: data.bescom_rate });
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }

  async function fetchReadings(propertyId) {
    try {
      const res = await fetch(`/api/readings?propertyId=${propertyId}`);
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      setReadings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching readings:', error);
      setReadings([]);
    }
  }

  // Onboarding handlers
  function handleStartOnboarding(e) {
    e.preventDefault();
    const num = parseInt(numHouses);
    if (num > 0 && num <= 50) {
      setHouseNames(Array(num).fill(''));
      setCurrentHouseIndex(0);
    }
  }

  function handleAddHouseName(e) {
    e.preventDefault();
    const newNames = [...houseNames];
    newNames[currentHouseIndex] = currentHouseName;
    setHouseNames(newNames);

    if (currentHouseIndex < houseNames.length - 1) {
      setCurrentHouseIndex(currentHouseIndex + 1);
      setCurrentHouseName('');
    } else {
      // All houses added, create them in database
      createAllHouses(newNames);
    }
  }

  async function createAllHouses(names) {
    try {
      for (const name of names) {
        if (name.trim()) {
          const res = await fetch('/api/properties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name.trim(), address: '' }),
          });
          if (!res.ok) {
            console.error('Failed to create property:', name);
          }
        }
      }
      setShowOnboarding(false);
      setNumHouses('');
      setHouseNames([]);
      setCurrentHouseIndex(0);
      setCurrentHouseName('');
      await fetchProperties();
    } catch (error) {
      console.error('Error creating houses:', error);
      alert('Failed to create houses. Please try again.');
    }
  }

  // Property operations
  async function handleAddProperty(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propertyForm),
      });
      if (res.ok) {
        fetchProperties();
        setPropertyForm({ name: '', address: '' });
        setShowPropertyModal(false);
      }
    } catch (error) {
      console.error('Error adding property:', error);
    }
  }

  async function handleDeleteProperty() {
    if (!confirm('Are you sure you want to delete this property and all its readings?')) return;
    try {
      const res = await fetch(`/api/properties?id=${selectedPropertyId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchProperties();
        setShowDetailsModal(false);
        setSelectedPropertyId(null);
      }
    } catch (error) {
      console.error('Error deleting property:', error);
    }
  }

  // Meter reading operations
  async function handleAddMeterReading(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          readingDate: meterForm.reading_date,
          meterReading: parseFloat(meterForm.meter_reading),
          photoUrl: meterForm.photo_url,
        }),
      });
      if (res.ok) {
        fetchReadings(selectedPropertyId);
        setMeterForm({
          reading_date: new Date().toISOString().split('T')[0],
          meter_reading: '',
          photo_url: '',
        });
        setShowMeterModal(false);
      }
    } catch (error) {
      console.error('Error adding meter reading:', error);
    }
  }

  async function handleUpdatePaymentStatus(readingId, status) {
    try {
      const res = await fetch(`/api/readings?id=${readingId}&action=payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: status }),
      });
      if (res.ok) {
        fetchReadings(selectedPropertyId);
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  }

  async function handleDeleteReading(readingId) {
    if (!confirm('Delete this reading?')) return;
    try {
      const res = await fetch(`/api/readings?id=${readingId}&action=delete`, {
        method: 'PATCH',
      });
      if (res.ok) {
        fetchReadings(selectedPropertyId);
      }
    } catch (error) {
      console.error('Error deleting reading:', error);
    }
  }

  // Settings operations
  async function handleUpdateSettings(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bescomRate: parseFloat(settingsForm.bescom_rate) }),
      });
      if (res.ok) {
        fetchSettings();
        setShowSettingsModal(false);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  }

  // Modal helpers
  function openPropertyModal() {
    setShowPropertyModal(true);
  }

  function closePropertyModal() {
    setShowPropertyModal(false);
  }

  function openMeterModal() {
    setShowMeterModal(true);
  }

  function closeMeterModal() {
    setShowMeterModal(false);
  }

  function openSettingsModal() {
    setShowSettingsModal(true);
  }

  function closeSettingsModal() {
    setShowSettingsModal(false);
  }

  function openDetailsModal(propertyId) {
    setSelectedPropertyId(propertyId);
    fetchReadings(propertyId);
    setShowDetailsModal(true);
  }

  function closeDetailsModal() {
    setShowDetailsModal(false);
    setSelectedPropertyId(null);
  }

  const selectedProperty = Array.isArray(properties) ? properties.find((p) => p.id === selectedPropertyId) : null;

  // Show onboarding modal if needed
  if (showOnboarding) {
    return (
      <div className="container">
        <div className={`modal show`}>
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <h2>🏠 Welcome to Meter Tracker!</h2>
            
            {houseNames && houseNames.length === 0 ? (
              <>
                <p style={{ marginBottom: '20px', fontSize: '16px', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.9)' }}>
                  Let's set up your rental properties. How many houses/flats do you want to track?
                </p>
                <form onSubmit={handleStartOnboarding}>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    placeholder="Enter number of houses (1-50)"
                    value={numHouses}
                    onChange={(e) => setNumHouses(e.target.value)}
                    required
                    autoFocus
                  />
                  <button type="submit" className="btn btn-primary">
                    Next
                  </button>
                </form>
              </>
            ) : houseNames && houseNames.length > 0 ? (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '10px' }}>
                    House {currentHouseIndex + 1} of {houseNames.length}
                  </p>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${((currentHouseIndex + 1) / houseNames.length) * 100}%`, 
                      height: '100%', 
                      background: 'linear-gradient(90deg, #667eea, #764ba2)',
                      transition: 'width 0.3s'
                    }}></div>
                  </div>
                </div>

                <form onSubmit={handleAddHouseName}>
                  <label style={{ marginBottom: '10px' }}>Enter name for property {currentHouseIndex + 1}</label>
                  <input
                    type="text"
                    placeholder={`e.g., House 1, Villa A, Flat 2B, Floor 3`}
                    value={currentHouseName}
                    onChange={(e) => setCurrentHouseName(e.target.value)}
                    required
                    autoFocus
                  />
                  <button type="submit" className="btn btn-primary">
                    {currentHouseIndex === houseNames.length - 1 ? '✓ Complete Setup' : 'Next'}
                  </button>
                </form>
              </>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header>
        <h1>📊 Meter Tracker</h1>
        <div className="header-actions">
          <button className="btn btn-settings" onClick={openSettingsModal}>
            ⚙️ Settings
          </button>
          <button className="btn btn-primary" onClick={openPropertyModal}>
            + Add Property
          </button>
        </div>
      </header>

      <main>
        {!databaseConnected && (
          <div className="alert-warning">
            <strong>⚠️ Database not connected</strong>
            <br/>
            {typeof window !== 'undefined' && window.location.hostname === 'localhost' ? (
              <>This is normal during local testing. To save data permanently, deploy to Vercel and add DATABASE_URL environment variable (see DEPLOYMENT.md).</>
            ) : (
              <>
                Database connection failed. Please visit <strong>/api/init</strong> to initialize the database, then refresh.
              </>
            )}
          </div>
        )}
        <div className="properties-grid">
          {loading ? (
            <p className="loading">Loading properties...</p>
          ) : properties.length === 0 ? (
            <p className="loading">No properties yet. Add one to get started!</p>
          ) : (
            properties.map((prop) => (
              <div
                key={prop.id}
                className="property-card"
                onClick={() => openDetailsModal(prop.id)}
              >
                <h3>{prop.name}</h3>
                {prop.address && <p>{prop.address}</p>}
                <p>Last Reading: {prop.last_reading_date || 'No data'}</p>
                <p>Value: {prop.last_reading || '-'} units</p>
                <span className={`status ${prop.last_payment_status || 'pending'}`}>
                  {prop.last_payment_status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                </span>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Add Property Modal */}
      <div id="propertyModal" className={`modal ${showPropertyModal ? 'show' : ''}`} onClick={closePropertyModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <span className="close" onClick={closePropertyModal}>
            &times;
          </span>
          <h2>Add New Property</h2>
          <form onSubmit={handleAddProperty}>
            <input
              type="text"
              placeholder="Property Name (e.g., House 1, Apt 2B)"
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
            <button type="submit" className="btn btn-primary">
              Add Property
            </button>
          </form>
        </div>
      </div>

      {/* Meter Reading Modal */}
      <div id="meterModal" className={`modal ${showMeterModal ? 'show' : ''}`} onClick={closeMeterModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <span className="close" onClick={closeMeterModal}>
            &times;
          </span>
          <h2>Add Meter Reading</h2>
          <form onSubmit={handleAddMeterReading}>
            <input
              type="date"
              value={meterForm.reading_date}
              onChange={(e) => setMeterForm({ ...meterForm, reading_date: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Current Meter Reading"
              step="0.01"
              value={meterForm.meter_reading}
              onChange={(e) => setMeterForm({ ...meterForm, meter_reading: e.target.value })}
              required
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    setMeterForm({ ...meterForm, photo_url: event.target.result });
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            <button type="submit" className="btn btn-primary">
              Save Reading
            </button>
          </form>
        </div>
      </div>

      {/* Settings Modal */}
      <div id="settingsModal" className={`modal ${showSettingsModal ? 'show' : ''}`} onClick={closeSettingsModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <span className="close" onClick={closeSettingsModal}>
            &times;
          </span>
          <h2>Settings</h2>
          <form onSubmit={handleUpdateSettings}>
            <label>BESCOM Rate (per unit)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={settingsForm.bescom_rate}
              onChange={(e) => setSettingsForm({ bescom_rate: e.target.value })}
              required
            />
            <button type="submit" className="btn btn-primary">
              Update Rate
            </button>
          </form>
        </div>
      </div>

      {/* Property Details Modal */}
      <div id="detailsModal" className={`modal ${showDetailsModal ? 'show' : ''}`} onClick={closeDetailsModal}>
        <div
          className="modal-content modal-large"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="close" onClick={closeDetailsModal}>
            &times;
          </span>
          {selectedProperty && (
            <>
              <div className="details-header">
                <h2>{selectedProperty.name}</h2>
                <button className="btn btn-danger" onClick={handleDeleteProperty}>
                  Delete Property
                </button>
              </div>
              <button className="btn btn-primary" style={{ marginBottom: '20px' }} onClick={openMeterModal}>
                + Add Reading
              </button>

              <table className="readings-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Meter Reading</th>
                    <th>Units Used</th>
                    <th>Bill (₹)</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center">
                        No readings yet
                      </td>
                    </tr>
                  ) : (
                    readings.map((reading) => (
                      <tr key={reading.id}>
                        <td>{new Date(reading.reading_date).toLocaleDateString()}</td>
                        <td>{reading.meter_reading}</td>
                        <td>{reading.units_consumed.toFixed(2)}</td>
                        <td>₹{reading.bill_amount.toFixed(2)}</td>
                        <td>
                          <select
                            value={reading.payment_status}
                            onChange={(e) => handleUpdatePaymentStatus(reading.id, e.target.value)}
                            style={{ padding: '4px 8px', borderRadius: '4px' }}
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                          </select>
                        </td>
                        <td>
                          <button
                            className="btn btn-danger btn-small"
                            onClick={() => handleDeleteReading(reading.id)}
                          >
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
