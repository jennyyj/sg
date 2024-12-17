import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface JwtPayloadWithId extends jwt.JwtPayload {
  id: string;
}

interface Preferences {
  shiftTimes: any;
  customCategories?: string[];
}

export async function GET() {
  try {
    const headersList = new Headers();
    const token = headersList.get('authorization')?.split(' ')[1]; // Assuming the token is passed as "Bearer <token>"

    if (!token) {
      return NextResponse.json({ error: 'Token is missing' }, { status: 401 });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayloadWithId;

    if (!decodedToken.id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.id;

    const preferences = await prisma.userPreference.findUnique({
      where: { userId },
    }) as Preferences | null; // Explicitly cast the result to Preferences or null

    if (!preferences) {
      return NextResponse.json({ error: 'Preferences not found' }, { status: 404 });
    }

    return NextResponse.json({
      preferences: {
        shiftTimes: preferences.shiftTimes,
        customCategories: preferences.customCategories || [], // Return custom categories
      },
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}
