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

    if (!job.shift || !job.shift.date || !job.shift.startTime || !job.shift.endTime) {
      console.error("Incomplete shift details for job:", jobId);
      return NextResponse.json({ error: 'Incomplete shift details' }, { status: 400 });
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

    // Fetch claimer phone details
    const claimerPhone = await prisma.phoneNumber.findFirst({
      where: { name: workerName },
    });

    if (!claimerPhone) {
      console.error("No phone number found for workerName:", workerName);
    } else {
      // Prepare shift start and reminder time
      const shiftStart = new Date(`${job.shift.date}T${job.shift.startTime}`);
      if (isNaN(shiftStart.getTime())) {
        console.error("Invalid shift date or time for job:", jobId);
        return NextResponse.json({ error: 'Invalid shift date or time' }, { status: 400 });
      }

      const reminderTime = new Date(shiftStart.getTime() - 60 * 60 * 1000); // 1 hour before the shift
      if (isNaN(reminderTime.getTime())) {
        console.error("Invalid reminder time for job:", jobId);
        return NextResponse.json({ error: 'Invalid reminder time' }, { status: 400 });
      }

      const reminderData = {
        jobId: job.id,
        phoneNumber: claimerPhone.number,
        message: `ShiftGrab Reminder: You have a shift at ${job.businessName} on ${shiftStart.toDateString()} from ${job.shift.startTime} - ${job.shift.endTime}.`,
        sendAt: reminderTime,
        sent: false,
      };

      try {
        await prisma.reminder.create({ data: reminderData });
        console.log(`Reminder created for ${claimerPhone.number} at ${reminderTime}`);
      } catch (error) {
        console.error("Error creating reminder:", error);
      }
    }

    // Notify other phone numbers in the same category
    const phoneNumbers = await prisma.phoneNumber.findMany({
      where: {
        categories: { has: job.category },
      },
    });

    const othersPromises = phoneNumbers
      .filter((phone) => phone.name !== workerName)
      .map(async (phone) => {
        const formattedDate = new Date(job.shift.date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const formattedTime = `${job.shift.startTime} - ${job.shift.endTime}`;
        const message = `${workerName} has claimed the shift for ${job.businessName} on ${formattedDate} from ${formattedTime}.`;

        try {
          await fetch('https://textbelt.com/text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: phone.number,
              message,
              key: process.env.TEXTBELT_API_KEY,
            }),
          });
        } catch (err) {
          console.error(`Failed to send SMS to ${phone.number}:`, err);
        }
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
