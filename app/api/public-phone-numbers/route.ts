import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // Extract the "category" from query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    // Fetch phone numbers filtered by category
    const phoneNumbers = await prisma.phoneNumber.findMany({
      where: {
        categories: { has: category },
      },
      select: {
        id: true,
        name: true,
        number: true,
      },
    });

    return NextResponse.json({ phoneNumbers });
  } catch (error) {
    console.error('Error fetching public phone numbers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch phone numbers' },
      { status: 500 }
    );
  }
}
