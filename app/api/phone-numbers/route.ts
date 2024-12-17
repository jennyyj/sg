import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface JwtPayloadWithId extends jwt.JwtPayload {
  id: string;
}

async function getUserId(request: Request): Promise<string | null> {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return null;

  try {
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtPayloadWithId;
    return decodedToken.id || null;
  } catch {
    return null;
  }
}

// GET: Fetch all phone numbers for the authenticated user
export async function GET(request: Request) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const phoneNumbers = await prisma.phoneNumber.findMany({
      where: { userId },
    });

    return NextResponse.json({ phoneNumbers });
  } catch (error) {
    console.error('Error fetching phone numbers:', error);
    return NextResponse.json({ error: 'Failed to fetch phone numbers' }, { status: 500 });
  }
}

// POST: Add a new phone number
export async function POST(request: Request) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, number, categories } = body;

    if (!name || !number || !categories || !Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { error: 'Invalid data. Name, number, and categories are required.' },
        { status: 400 }
      );
    }

    const phoneNumber = await prisma.phoneNumber.create({
      data: {
        name,
        number,
        categories,
        userId,
      },
    });

    return NextResponse.json({ phoneNumber }, { status: 201 });
  } catch (error) {
    console.error('Error adding phone number:', error);
    return NextResponse.json({ error: 'Failed to add phone number' }, { status: 500 });
  }
}


// PUT: Update an existing phone number
export async function PUT(request: Request) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, number, categories } = await request.json();

    const phoneNumber = await prisma.phoneNumber.findUnique({
      where: { id },
    });

    if (!phoneNumber || phoneNumber.userId !== userId) {
      return NextResponse.json({ error: 'Phone number not found or access denied' }, { status: 404 });
    }

    const updatedPhoneNumber = await prisma.phoneNumber.update({
      where: { id },
      data: {
        name,
        number,
        categories,
      },
    });

    return NextResponse.json({ updatedPhoneNumber });
  } catch (error) {
    console.error('Error updating phone number:', error);
    return NextResponse.json({ error: 'Failed to update phone number' }, { status: 500 });
  }
}

// DELETE: Remove a phone number
export async function DELETE(request: Request) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    const phoneNumber = await prisma.phoneNumber.findUnique({
      where: { id },
    });

    if (!phoneNumber || phoneNumber.userId !== userId) {
      return NextResponse.json({ error: 'Phone number not found or access denied' }, { status: 404 });
    }

    await prisma.phoneNumber.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Phone number deleted successfully' });
  } catch (error) {
    console.error('Error deleting phone number:', error);
    return NextResponse.json({ error: 'Failed to delete phone number' }, { status: 500 });
  }
}
