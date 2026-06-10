import { getSettings, updateSettings } from '@/lib/db';

export async function GET() {
  try {
    const settings = await getSettings();
    return Response.json(settings);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { bescomRate } = await request.json();

    if (bescomRate === undefined || bescomRate < 0) {
      return Response.json({ error: 'Invalid BESCOM rate' }, { status: 400 });
    }

    const result = await updateSettings(bescomRate);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
