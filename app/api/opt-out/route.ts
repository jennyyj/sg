import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Handle POST Request
export async function POST(request: Request) {
  try {
    const { number, name } = await request.json();

    if (!number || !name) {
      return NextResponse.json({ error: 'Name and phone number are required' }, { status: 400 });
    }

    // Find the phone number and mark as opted out
    const phone = await prisma.phoneNumber.findFirst({
      where: {
        number,
        name: {
          equals: name,
          mode: 'insensitive', // Case-insensitive comparison
        },
      },
    });

    if (!phone) {
      return NextResponse.json({ error: 'Include your first and last name' }, { status: 404 });
    }

    await prisma.phoneNumber.update({
      where: { id: phone.id },
      data: { optedOut: true },
    });

    return NextResponse.json({ message: 'Successfully opted out of messages' });
  } catch (error) {
    console.error('Error opting out:', error);
    return NextResponse.json({ error: 'Failed to opt out' }, { status: 500 });
  }
}

// Handle GET Request (Optional for Debugging)
export async function GET() {
  return NextResponse.json({ message: 'Opt-out endpoint is ready' });
}
