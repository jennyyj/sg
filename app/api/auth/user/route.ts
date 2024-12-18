import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma =
  (global as any).prisma ||
  new PrismaClient({
  });

if (process.env.NODE_ENV !== 'production') {
  (global as any).prisma = prisma;
}

interface JwtPayloadWithId extends jwt.JwtPayload {
  id: string;
}

export async function GET(request: Request) {
  try {
    // Extract token from the Authorization header
    const token = request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Token is missing' }, { status: 401 });
    }

    // Verify the token
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtPayloadWithId;

    if (!decodedToken.id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch the user from the database with preferences
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.id },
      include: { preferences: true }, // Include preferences
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Extract relevant data
    const { username, preferences } = user;
    const businessName = user.businessName || username;
    const shiftTimes = preferences?.shiftTimes || {};
    const customCategories = preferences?.customCategories || [];

    return NextResponse.json({
      user: {
        username,
        businessName,
        preferences: {
          shiftTimes,
          customCategories,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
