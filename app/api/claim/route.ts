import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma =
  (global as any).prisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  (global as any).prisma = prisma;
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}`;

export async function POST(request: Request) {
  try {
    const { jobId, workerName } = await request.json();
    console.log("Received request with jobId:", jobId, "and workerName:", workerName);

    // Find the job with shift details
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { shift: true },
    });

    if (!job) {
      console.error("Job not found for jobId:", jobId);
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.claimedBy) {
      console.error("Job already claimed by:", job.claimedBy);
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
    console.log("Updated job:", updatedJob);

    // Reminder functionality
    const claimerPhone = await prisma.phoneNumber.findFirst({
      where: { name: workerName },
    });
    console.log("Claimer phone:", claimerPhone);

    if (claimerPhone) {
      // Validate shift details
      if (!job.shift || !job.shift.date || !job.shift.startTime || !job.shift.endTime) {
        throw new Error('Incomplete shift details. Cannot schedule reminder.');
      }

      const shiftStart = new Date(`${job.shift.date}T${job.shift.startTime}`);
      if (isNaN(shiftStart.getTime())) {
        throw new Error('Invalid shift date or time. Cannot schedule reminder.');
      }

      const reminderTime = new Date(shiftStart.getTime() - 60 * 60 * 1000); // 1 hour before the shift starts
      if (isNaN(reminderTime.getTime())) {
        throw new Error('Invalid reminder time. Cannot schedule reminder.');
      }

      const reminderData = {
        jobId: job.id,
        phoneNumber: claimerPhone.number,
        message: `ShiftGrab Reminder: You have a shift at ${job.businessName} on ${shiftStart.toDateString()} from ${job.shift.startTime} - ${job.shift.endTime}.`,
        sendAt: reminderTime,
        sent: false,
      };

      console.log('Reminder Data:', reminderData);

      try {
        await prisma.reminder.create({ data: reminderData });
        console.log(`Reminder scheduled for ${claimerPhone.number} at ${reminderTime}`);
      } catch (error) {
        console.error("Error creating reminder:", error);
      }
    } else {
      console.error("No phone number found for workerName:", workerName);
    }

    // Helper functions for date and time formatting
    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

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
        timeZone: 'UTC',
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

