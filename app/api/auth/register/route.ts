import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma =
  (global as any).prisma ||
  new PrismaClient({
  });

if (process.env.NODE_ENV !== 'production') {
  (global as any).prisma = prisma;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, phoneNumbers, shiftTimes, customCategories } = body;

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Username already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and user preferences
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        phoneNumbers: {
          create: phoneNumbers.map((phone: { name: string; number: string; categories?: string[] }) => ({
            name: phone.name,
            number: phone.number,
            categories: (phone.categories || []).map((c) => c.toLowerCase().trim()), // Ensure array format
          })),
        },
        preferences: {
          create: {
            shiftTimes: shiftTimes || {},
            customCategories: customCategories || [],
          },
        },
      },
    });

    return NextResponse.json(
      { message: 'User registered successfully', user },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { 
        message: 'Error registering user', 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
