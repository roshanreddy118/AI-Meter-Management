import { getReadings, addMeterReading, deleteReading, updatePaymentStatus } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return Response.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const readings = await getReadings(propertyId);
    return Response.json(readings);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { propertyId, readingDate, meterReading, photoUrl } = await request.json();

    if (!propertyId || !readingDate || meterReading === undefined) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await addMeterReading(propertyId, readingDate, meterReading, photoUrl);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    if (!id) {
      return Response.json({ error: 'Reading ID is required' }, { status: 400 });
    }

    if (action === 'delete') {
      const result = await deleteReading(id);
      return Response.json(result);
    }

    if (action === 'payment') {
      const { paymentStatus } = await request.json();
      if (!['pending', 'paid'].includes(paymentStatus)) {
        return Response.json({ error: 'Invalid payment status' }, { status: 400 });
      }
      const result = await updatePaymentStatus(id, paymentStatus);
      return Response.json(result);
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
