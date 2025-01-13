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

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        claimedBy: workerName,
        claimedAt: new Date(),
        status: 'CLAIMED',
      },
    });

    const claimerPhone = await prisma.phoneNumber.findFirst({
      where: { name: workerName },
    });

    if (claimerPhone) {
      const shiftStart = new Date(`${job.shift.date}T${job.shift.startTime}`);
      const reminderTime = new Date(shiftStart.getTime() - 60 * 60 * 1000);

      const reminderData = {
        jobId: job.id,
        phoneNumber: claimerPhone.number,
        message: `ShiftGrab Reminder: You have a shift at ${job.businessName} on ${job.shift.date} from ${job.shift.startTime} - ${job.shift.endTime}.`,
        sendAt: reminderTime,
        sent: false,
      };

      try {
        await prisma.reminder.create({ data: reminderData });
        console.log(`Reminder scheduled for ${claimerPhone.number} at ${reminderTime}`);
      } catch (error) {
        console.error('Prisma Reminder Create Error:', error.message, error.stack);
      }
    } else {
      console.error('No phone number found for workerName:', workerName);
    }

    const thankYouLink = `${baseUrl}/thank-you/${jobId}`;
    const phoneNumbers = await prisma.phoneNumber.findMany({
      where: {
        categories: { has: job.category },
      },
    });

    const claimerPhoneForSMS = phoneNumbers.find((phone) => phone.name === workerName);

    if (claimerPhoneForSMS) {
      const formattedDate = new Date(job.shift.date || '').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      });
      const formattedTime = `${job.shift.startTime} - ${job.shift.endTime}`;

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

    const othersPromises = phoneNumbers
      .filter((phone) => phone.name !== workerName)
      .map(async (phone) => {
        const formattedDate = new Date(job.shift.date || '').toLocaleDateString('en-US');
        const message = `${workerName} has claimed the shift for ${job.businessName} on ${formattedDate}.`;

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
    console.error('Error claiming job:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to claim job' }, { status: 500 });
  }
}
