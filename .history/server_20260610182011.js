import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('public'));

// Initialize SQLite database
const db = new sqlite3.Database('meter_tracker.db', (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Properties table
    db.run(`
      CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Meter readings table
    db.run(`
      CREATE TABLE IF NOT EXISTS meter_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        property_id INTEGER NOT NULL,
        reading_date DATE NOT NULL,
        meter_reading REAL NOT NULL,
        photo_url TEXT,
        units_consumed REAL,
        bill_amount REAL,
        payment_status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id)
      )
    `);

    // Settings table
    db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bescom_rate REAL DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default settings if not exists
    db.get('SELECT COUNT(*) as count FROM settings', (err, row) => {
      if (row.count === 0) {
        db.run(`INSERT INTO settings (bescom_rate) VALUES (8.5)`);
      }
    });
  });
}

// ============ PROPERTIES ENDPOINTS ============

// Get all properties
app.get('/api/properties', (req, res) => {
  db.all(`
    SELECT p.*, 
           (SELECT meter_reading FROM meter_readings WHERE property_id = p.id ORDER BY reading_date DESC LIMIT 1) as last_reading,
           (SELECT reading_date FROM meter_readings WHERE property_id = p.id ORDER BY reading_date DESC LIMIT 1) as last_reading_date,
           (SELECT payment_status FROM meter_readings WHERE property_id = p.id ORDER BY reading_date DESC LIMIT 1) as last_payment_status
    FROM properties p
    ORDER BY p.name
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows || []);
    }
  });
});

// Add new property
app.post('/api/properties', (req, res) => {
  const { name, address } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Property name is required' });
  }
  
  db.run(
    'INSERT INTO properties (name, address) VALUES (?, ?)',
    [name, address || ''],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ id: this.lastID, name, address });
      }
    }
  );
});

// Delete property
app.delete('/api/properties/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM meter_readings WHERE property_id = ?', [id]);
  db.run('DELETE FROM properties WHERE id = ?', [id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ success: true });
    }
  });
});

// ============ METER READINGS ENDPOINTS ============

// Get readings for a property
app.get('/api/readings/:property_id', (req, res) => {
  const { property_id } = req.params;
  db.all(
    'SELECT * FROM meter_readings WHERE property_id = ? ORDER BY reading_date DESC',
    [property_id],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows || []);
      }
    }
  );
});

// Add meter reading
app.post('/api/readings', (req, res) => {
  const { property_id, reading_date, meter_reading, photo_url } = req.body;
  
  if (!property_id || !reading_date || meter_reading === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Get BESCOM rate
  db.get('SELECT bescom_rate FROM settings LIMIT 1', (err, setting) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const bescom_rate = setting?.bescom_rate || 8.5;

    // Get previous reading
    db.get(
      'SELECT meter_reading FROM meter_readings WHERE property_id = ? ORDER BY reading_date DESC LIMIT 1',
      [property_id],
      (err, row) => {
        const previous_reading = row?.meter_reading || 0;
        const units_consumed = meter_reading - previous_reading;
        const bill_amount = units_consumed * bescom_rate;

        db.run(
          `INSERT INTO meter_readings 
           (property_id, reading_date, meter_reading, photo_url, units_consumed, bill_amount, payment_status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [property_id, reading_date, meter_reading, photo_url || null, units_consumed, bill_amount, 'pending'],
          function(err) {
            if (err) {
              res.status(500).json({ error: err.message });
            } else {
              res.json({
                id: this.lastID,
                units_consumed,
                bill_amount,
                bescom_rate
              });
            }
          }
        );
      }
    );
  });
});

// Update payment status
app.patch('/api/readings/:id/payment', (req, res) => {
  const { id } = req.params;
  const { payment_status } = req.body;

  if (!['pending', 'paid'].includes(payment_status)) {
    return res.status(400).json({ error: 'Invalid payment status' });
  }

  db.run(
    'UPDATE meter_readings SET payment_status = ? WHERE id = ?',
    [payment_status, id],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ success: true, payment_status });
      }
    }
  );
});

// Delete reading
app.delete('/api/readings/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM meter_readings WHERE id = ?', [id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ success: true });
    }
  });
});

// ============ SETTINGS ENDPOINTS ============

// Get settings
app.get('/api/settings', (req, res) => {
  db.get('SELECT * FROM settings LIMIT 1', (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(row || { bescom_rate: 8.5 });
    }
  });
});

// Update BESCOM rate
app.patch('/api/settings', (req, res) => {
  const { bescom_rate } = req.body;

  if (bescom_rate === undefined || bescom_rate < 0) {
    return res.status(400).json({ error: 'Invalid BESCOM rate' });
  }

  db.run(
    'UPDATE settings SET bescom_rate = ?, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM settings LIMIT 1)',
    [bescom_rate],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ success: true, bescom_rate });
      }
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Database: meter_tracker.db');
});
