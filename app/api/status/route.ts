import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma =
  (global as any).prisma ||
  new PrismaClient({
    log: ['query'], // Optional: Logs SQL queries
  });

if (process.env.NODE_ENV !== 'production') {
  (global as any).prisma = prisma;
}

interface JwtPayloadWithId extends jwt.JwtPayload {
  id: string;
}

export async function GET(request: Request) {
  try {
    // Extract the token from the Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader ? authHeader.split(' ')[1] : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Token is missing' }, { status: 401 });
    }

    let userId: string;
    try {
      const decodedToken = jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as JwtPayloadWithId;
      userId = decodedToken.id;
    } catch (error) {
      console.error('Invalid token:', error);
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    try {
      const updateResult = await prisma.job.updateMany({
        where: {
          status: 'PENDING',
          createdAt: { lt: threeDaysAgo },
          userId,
        },
        data: { status: 'UNCLAIMED' },
      });
      console.log(`${updateResult.count} jobs moved to UNCLAIMED.`);
    } catch (updateError) {
      console.error('Error updating jobs to UNCLAIMED:', updateError);
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    // Fetch a specific job if jobId is provided
    if (jobId) {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { shift: true },
      });

      if (!job || job.userId !== userId) {
        return NextResponse.json({ error: 'Job not found or access denied' }, { status: 404 });
      }

      return NextResponse.json({ job });
    }

    // Fetch all jobs created by the current user
    const jobs = await prisma.job.findMany({
      where: { userId },
      include: { shift: true },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json({
      jobs: jobs.map((job) => ({
        ...job,
        claimedBy: job.claimedBy || null, 
      })),
    });
    
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { jobId } = await request.json();

    // Fetch the job details, including the category
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { user: true, shift: true },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Ensure the job belongs to the requesting user
    const authHeader = request.headers.get('authorization');
    const token = authHeader ? authHeader.split(' ')[1] : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Token is missing' }, { status: 401 });
    }

    let userId: string;
    try {
      const decodedToken = jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as JwtPayloadWithId;
      userId = decodedToken.id;
    } catch (error) {
      console.error('Invalid token:', error);
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    if (job.userId !== userId) {
      return NextResponse.json({ error: 'Access denied: Not your job' }, { status: 403 });
    }

    // Retrieve phone numbers only in the job's category
    const phoneNumbers = await prisma.phoneNumber.findMany({
      where: {
        userId: job.userId,
        categories: {
          has: job.category, 
        },
      },
    });

    // Send SMS only to the relevant phone numbers
    const smsPromises = phoneNumbers.map(async (phone) => {
      const smsResponse = await fetch('https://textbelt.com/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.number,
          message: `The shift for ${job.businessName} on ${new Date(job.shift.date).toLocaleDateString()} has been removed.`,
          key: process.env.TEXTBELT_API_KEY,
        }),
      });

      const smsResult = await smsResponse.json();
      if (!smsResult.success) {
        console.error(`Failed to send SMS to ${phone.number}:`, smsResult);
      }
    });

    await Promise.all(smsPromises);

    // Update the job status to REMOVED
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'REMOVED' },
    });

    return NextResponse.json({ message: 'Shift removed successfully' });
  } catch (error) {
    console.error('Error removing shift:', error);
    return NextResponse.json({ error: 'Failed to remove shift' }, { status: 500 });
  }
}
