import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    // Delete all data
    await sql`DELETE FROM meter_readings`;
    await sql`DELETE FROM properties`;
    await sql`DELETE FROM settings`;
    
    // Re-insert default settings
    await sql`INSERT INTO settings (bescom_rate) VALUES (8.5)`;

    return Response.json({
      success: true,
      message: 'Database cleared successfully',
      data: 'All rent houses and readings deleted. Default BESCOM rate reset to 8.5'
    }, { status: 200 });
  } catch (error) {
    console.error('Reset error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
