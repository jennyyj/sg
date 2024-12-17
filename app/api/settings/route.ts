import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const prisma =
  (global as any).prisma ||
  new PrismaClient({
    log: ['query'], // Optional: Logs SQL queries
  });

if (process.env.NODE_ENV !== 'production') {
  (global as any).prisma = prisma;
}

export async function GET(request: Request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Token is missing' }, { status: 401 });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    if (!decodedToken.id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.id;

    const preferences = await prisma.userPreference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      return NextResponse.json({ error: 'Preferences not found' }, { status: 404 });
    }

    return NextResponse.json({
      preferences: {
        shiftTimes: preferences.shiftTimes || {},
        customCategories: preferences.customCategories || [],
      },
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      console.error('Token is missing in the request headers'); // Debug log
      return NextResponse.json({ error: 'Token is missing' }, { status: 401 });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    if (!decodedToken.id) {
      console.error('Invalid token:', token); // Debug log
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.id;

    const { shiftTimes, username, password, customCategories } = await request.json();

    // Update user preferences
    const preferences = await prisma.userPreference.upsert({
      where: { userId },
      update: { 
        shiftTimes, 
        customCategories: customCategories || [] 
      },
      create: {
        userId,
        shiftTimes,
        customCategories: customCategories || [],
      },
    });

    // Update username and hashed password if provided
    if (username || password) {
      const updateData: { username?: string; password?: string } = {};
      if (username) updateData.username = username;
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

