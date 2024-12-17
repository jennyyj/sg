import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import type { NextRequest } from 'next/server';

const prisma = new PrismaClient();

// Correctly typed RouteHandlerContext for Next.js App Router
export async function GET(request: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params; // Destructure the route parameter 'id'

  try {
    // Fetch the job with shift details using Prisma
    const job = await prisma.job.findUnique({
      where: { id }, // Correctly pass the ID
      include: { shift: true }, // Include associated shift details
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
