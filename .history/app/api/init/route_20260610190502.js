import { initializeDatabase } from '@/lib/db';

export async function GET() {
  try {
    console.log('Initialization endpoint called');
    
    // Call the database initialization function
    await initializeDatabase();
    
    return Response.json(
      {
        success: true,
        message: 'Database initialized successfully',
        tables_created: [
          'properties (id, name, address, created_at)',
          'meter_readings (id, property_id, reading_date, meter_reading, photo_url, units_consumed, bill_amount, payment_status, created_at)',
          'settings (id, bescom_rate, updated_at) with default rate 8.5'
        ],
        next_step: 'Refresh your application - all tables are ready to use'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Initialization error:', error);
    return Response.json(
      {
        success: false,
        error: error.message,
        message: 'Failed to initialize database'
      },
      { status: 500 }
    );
  }
}
