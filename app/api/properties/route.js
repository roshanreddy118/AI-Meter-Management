import { getProperties, addProperty, deleteProperty } from '@/lib/db';

export async function GET() {
  try {
    const properties = await getProperties();
    return Response.json(properties);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, address } = await request.json();
    
    if (!name) {
      return Response.json({ error: 'Property name is required' }, { status: 400 });
    }

    const property = await addProperty(name, address);
    return Response.json(property);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const result = await deleteProperty(id);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
