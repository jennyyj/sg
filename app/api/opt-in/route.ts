import { NextResponse } from 'next/server'; // Import NextResponse
import { PrismaClient } from '@prisma/client'; // Import PrismaClient

const prisma =
  (global as any).prisma ||
  new PrismaClient({
    log: ['query'], // Optional: Logs SQL queries
  });

if (process.env.NODE_ENV !== 'production') {
  (global as any).prisma = prisma;
}

export async function POST(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.phoneNumber.update({
      where: { id },
      data: { optedOut: false },
    });

    return NextResponse.json({ message: 'User opted back in successfully' });
  } catch (error) {
    console.error('Error opting back in:', error);
    return NextResponse.json({ error: 'Failed to opt in' }, { status: 500 });
  }
}
