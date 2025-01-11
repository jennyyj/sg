import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma =
  (global as any).prisma ||
  new PrismaClient({
  });

if (process.env.NODE_ENV !== 'production') {
  (global as any).prisma = prisma;
}

// Use dynamic base URL based on environment
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}`;

export async function POST(request: Request) {
  try {
    const { jobId } = await request.json();

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { shift: true }, // Include shift details
    });

    if (!job || !job.shift) {
      return NextResponse.json({ error: 'Job or shift details not found' }, { status: 404 });
    }

    // Update the job status to UNCLAIMED
    await prisma.job.update({
      where: { id: jobId },
      data: {
        claimedBy: null,
        claimedAt: null,
        status: 'UNCLAIMED',
      },
    });

        // Helper function to format date
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Helper function to format time
const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12; // Convert to 12-hour format
  return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

    // Retrieve phone numbers in the same category
    const phoneNumbers = await prisma.phoneNumber.findMany({
      where: {
        categories: { has: job.category },
      },
    });

    // Send SMS to relevant phone numbers
    const smsPromises = phoneNumbers.map(async (phone) => {
      const formattedDate = new Date(job.shift?.date || '').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC', // Ensure consistent formatting
      });      
      const formattedTime = `${formatTime(job.shift?.startTime || '')} - ${formatTime(job.shift?.endTime || '')}`;
      const claimLink = `${process.env.NEXT_PUBLIC_BASE_URL || baseUrl}/claim-shift/${job.id}`;
    
      const message = `The job for ${job.businessName} on ${formattedDate} from ${formattedTime} is now unclaimed and available. Claim it here: ${claimLink}`;
    
      const smsResponse = await fetch('https://textbelt.com/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.number,
          message,
          key: process.env.TEXTBELT_API_KEY,
        }),
      });
    
      const smsResult = await smsResponse.json();
      if (!smsResult.success) {
        console.error(`Failed to send SMS to ${phone.number}:`, smsResult);
      }
    });
    

    await Promise.all(smsPromises);

    return NextResponse.json({ message: 'Shift successfully unclaimed' });
  } catch (error) {
    console.error('Error unclaiming job:', error);
    return NextResponse.json({ error: 'Failed to unclaim job' }, { status: 500 });
  }
}
