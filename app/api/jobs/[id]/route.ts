import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Fetch the job with shift details using Prisma
    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: { shift: true },
    });

    // Handle the case where the job is not found
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Return the found job data
    return NextResponse.json({ job }, { status: 200 });
  } catch (error) {
    console.error('Error fetching job:', error);

    // Handle any unexpected errors
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

