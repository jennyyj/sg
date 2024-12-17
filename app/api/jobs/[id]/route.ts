import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma =
  (global as any).prisma ||
  new PrismaClient({
    log: ['query'], // Optional: Logs SQL queries
  });

if (process.env.NODE_ENV !== 'production') {
  (global as any).prisma = prisma;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore: Suppress Next.js type error
export async function GET(request: any, context: any) {
  const { id } = context.params;

  try {
    const job = await prisma.job.findUnique({
      where: { id },
      include: { shift: true },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ job }, { status: 200 });
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}
