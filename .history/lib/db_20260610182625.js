import { sql } from '@vercel/postgres';

export const initializeDatabase = async () => {
  try {
    // Create properties table
    await sql`
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create meter readings table
    await sql`
      CREATE TABLE IF NOT EXISTS meter_readings (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL,
        reading_date DATE NOT NULL,
        meter_reading DECIMAL(10, 2) NOT NULL,
        photo_url TEXT,
        units_consumed DECIMAL(10, 2),
        bill_amount DECIMAL(10, 2),
        payment_status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id)
      )
    `;

    // Create settings table
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        bescom_rate DECIMAL(10, 2) DEFAULT 8.5,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Insert default settings if not exists
    const checkSettings = await sql`SELECT COUNT(*) as count FROM settings`;
    if (checkSettings.rows[0].count === 0) {
      await sql`INSERT INTO settings (bescom_rate) VALUES (8.5)`;
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

export async function getProperties() {
  try {
    const result = await sql`
      SELECT p.*, 
             (SELECT meter_reading FROM meter_readings WHERE property_id = p.id ORDER BY reading_date DESC LIMIT 1) as last_reading,
             (SELECT reading_date FROM meter_readings WHERE property_id = p.id ORDER BY reading_date DESC LIMIT 1) as last_reading_date,
             (SELECT payment_status FROM meter_readings WHERE property_id = p.id ORDER BY reading_date DESC LIMIT 1) as last_payment_status
      FROM properties p
      ORDER BY p.name
    `;
    return result.rows;
  } catch (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }
}

export async function addProperty(name, address) {
  try {
    const result = await sql`
      INSERT INTO properties (name, address) VALUES (${name}, ${address || ''})
      RETURNING id, name, address
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Error adding property:', error);
    throw error;
  }
}

export async function deleteProperty(id) {
  try {
    await sql`DELETE FROM meter_readings WHERE property_id = ${id}`;
    await sql`DELETE FROM properties WHERE id = ${id}`;
    return { success: true };
  } catch (error) {
    console.error('Error deleting property:', error);
    throw error;
  }
}

export async function getReadings(propertyId) {
  try {
    const result = await sql`
      SELECT * FROM meter_readings 
      WHERE property_id = ${propertyId} 
      ORDER BY reading_date DESC
    `;
    return result.rows;
  } catch (error) {
    console.error('Error fetching readings:', error);
    throw error;
  }
}

export async function addMeterReading(propertyId, readingDate, meterReading, photoUrl) {
  try {
    // Get BESCOM rate
    const settingsResult = await sql`SELECT bescom_rate FROM settings LIMIT 1`;
    const bescomRate = settingsResult.rows[0]?.bescom_rate || 8.5;

    // Get previous reading
    const prevResult = await sql`
      SELECT meter_reading FROM meter_readings 
      WHERE property_id = ${propertyId} 
      ORDER BY reading_date DESC 
      LIMIT 1
    `;

    const previousReading = prevResult.rows[0]?.meter_reading || 0;
    const unitsConsumed = meterReading - previousReading;
    const billAmount = unitsConsumed * bescomRate;

    const result = await sql`
      INSERT INTO meter_readings 
      (property_id, reading_date, meter_reading, photo_url, units_consumed, bill_amount, payment_status)
      VALUES (${propertyId}, ${readingDate}, ${meterReading}, ${photoUrl || null}, ${unitsConsumed}, ${billAmount}, 'pending')
      RETURNING *
    `;

    return {
      id: result.rows[0].id,
      unitsConsumed,
      billAmount,
      bescomRate
    };
  } catch (error) {
    console.error('Error adding meter reading:', error);
    throw error;
  }
}

export async function updatePaymentStatus(readingId, paymentStatus) {
  try {
    const result = await sql`
      UPDATE meter_readings 
      SET payment_status = ${paymentStatus}
      WHERE id = ${readingId}
      RETURNING *
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
}

export async function deleteReading(id) {
  try {
    await sql`DELETE FROM meter_readings WHERE id = ${id}`;
    return { success: true };
  } catch (error) {
    console.error('Error deleting reading:', error);
    throw error;
  }
}

export async function getSettings() {
  try {
    const result = await sql`SELECT * FROM settings LIMIT 1`;
    return result.rows[0] || { bescom_rate: 8.5 };
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
}

export async function updateSettings(bescomRate) {
  try {
    const result = await sql`
      UPDATE settings 
      SET bescom_rate = ${bescomRate}, updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT id FROM settings LIMIT 1)
      RETURNING *
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
}
