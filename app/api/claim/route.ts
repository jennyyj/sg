import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma =
  (global as any).prisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  (global as any).prisma = prisma;
}

// Use dynamic base URL based on environment
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}`;

export async function POST(request: Request) {
  try {
    const { jobId, workerName } = await request.json();

    // Find the job with shift details
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { shift: true },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.claimedBy) {
      return NextResponse.json({ error: 'Job already claimed' }, { status: 400 });
    }

    // Update the job status to CLAIMED
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        claimedBy: workerName,
        claimedAt: new Date(),
        status: 'CLAIMED',
      },
    });

    // Add reminder functionality
    const shiftStart = new Date(`${job.shift.date}T${job.shift.startTime}`);
    const reminderTime = new Date(shiftStart.getTime() - 60 * 60 * 1000); // 1 hour before the shift starts

    const claimerPhone = await prisma.phoneNumber.findFirst({
      where: { name: workerName },
    });

    if (claimerPhone) {
      const reminderMessage = `ShiftGrab Reminder: You have a shift at ${job.businessName} on ${job.shift.date} from ${job.shift.startTime} - ${job.shift.endTime}.`;

      await prisma.reminder.create({
        data: {
          jobId: job.id,
          phoneNumber: claimerPhone.number,
          message: reminderMessage,
          sendAt: reminderTime,
          sent: false,
        },
      });

      console.log(`Reminder scheduled for ${claimerPhone.number} at ${reminderTime}`);
    }

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

    const thankYouLink = `${baseUrl}/thank-you/${jobId}`;

    // Retrieve phone numbers in the same category
    const phoneNumbers = await prisma.phoneNumber.findMany({
      where: {
        categories: { has: job.category },
      },
    });

    // Send personalized SMS to the claimer
    const claimerPhoneForSMS = phoneNumbers.find((phone) => phone.name === workerName);

    if (claimerPhoneForSMS) {
      const formattedDate = new Date(job.shift?.date || '').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC', // Ensure consistent formatting
      });
      const formattedTime = `${formatTime(job.shift?.startTime || '')} - ${formatTime(job.shift?.endTime || '')}`;

      await fetch('https://textbelt.com/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: claimerPhoneForSMS.number,
          message: `Thank you for claiming the job for ${job.businessName} on ${formattedDate} from ${formattedTime}. Need to unclaim? Unclaim the shift here: ${thankYouLink}`,
          key: process.env.TEXTBELT_API_KEY,
        }),
      });
    }

    // Send general notification to other phone numbers in the category
    const othersPromises = phoneNumbers
      .filter((phone) => phone.name !== workerName)
      .map(async (phone) => {
        const formattedDate = formatDate(job.shift?.date || '');
        const formattedTime = `${formatTime(job.shift?.startTime || '')} - ${formatTime(job.shift?.endTime || '')}`;

        const message = `${workerName} has claimed the shift for ${job.businessName} on ${formattedDate} from ${formattedTime}.`;

        await fetch('https://textbelt.com/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: phone.number,
            message,
            key: process.env.TEXTBELT_API_KEY,
          }),
        });
      });

    await Promise.all(othersPromises);

    return NextResponse.json({
      message: 'Shift successfully claimed',
      job: updatedJob,
    });
  } catch (error) {
    console.error('Error claiming job:', error);
    return NextResponse.json({ error: 'Failed to claim job' }, { status: 500 });
  }
}
