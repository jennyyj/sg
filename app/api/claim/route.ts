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

    // Fetch the job with associated shift details
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

    // Validate shift details
    if (!job.shift || !job.shift.date || !job.shift.startTime || !job.shift.endTime) {
      console.error("Incomplete shift details:", job.shift);
      return NextResponse.json({ error: 'Incomplete shift details' }, { status: 400 });
    }

    // Parse and handle shift times
    const shiftDate = new Date(job.shift.date);
    const startTimeParts = job.shift.startTime.split(':').map(Number);
    const endTimeParts = job.shift.endTime.split(':').map(Number);

    const shiftStart = new Date(
      shiftDate.getFullYear(),
      shiftDate.getMonth(),
      shiftDate.getDate(),
      startTimeParts[0],
      startTimeParts[1]
    );

    let shiftEnd = new Date(
      shiftDate.getFullYear(),
      shiftDate.getMonth(),
      shiftDate.getDate(),
      endTimeParts[0],
      endTimeParts[1]
    );

    // Adjust shiftEnd to the next day if endTime is earlier than startTime
    if (shiftEnd < shiftStart) {
      shiftEnd.setDate(shiftEnd.getDate() + 1);
    }

    const reminderTime = new Date(shiftStart.getTime() - 60 * 60 * 1000); // 1 hour before the shift starts

    if (isNaN(shiftStart.getTime()) || isNaN(shiftEnd.getTime()) || isNaN(reminderTime.getTime())) {
      console.error("Invalid shift times:", { shiftStart, shiftEnd, reminderTime });
      return NextResponse.json({ error: 'Invalid shift times' }, { status: 400 });
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

    // Send reminder text to claimer
    const claimerPhone = await prisma.phoneNumber.findFirst({
      where: { name: workerName },
    });

    if (claimerPhone) {
      const reminderData = {
        jobId: job.id,
        phoneNumber: claimerPhone.number,
        message: `ShiftGrab Reminder: You have a shift at ${job.businessName} on ${shiftStart.toDateString()} from ${job.shift.startTime} - ${job.shift.endTime}.`,
        sendAt: reminderTime,
        sent: false,
      };

      try {
        await prisma.reminder.create({ data: reminderData });
        console.log(`Reminder scheduled for ${claimerPhone.number} at ${reminderTime}`);
      } catch (error) {
        console.error("Error creating reminder:", error);
      }

      // Send thank-you text with "Unclaim" link
      const formattedShiftDate = shiftStart.toDateString();
      const unclaimLink = `${baseUrl}/unclaim/${jobId}`;
      const thankYouMessage = `Thank you for claiming the shift at ${job.businessName} on ${formattedShiftDate} from ${job.shift.startTime} to ${job.shift.endTime}. Plans changed? Unclaim here: ${unclaimLink}`;

      await fetch('https://textbelt.com/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: claimerPhone.number,
          message: thankYouMessage,
          key: process.env.TEXTBELT_API_KEY,
        }),
      });
      console.log(`Thank-you text with unclaim link sent to ${claimerPhone.number}`);
    } else {
      console.error("No phone number found for workerName:", workerName);
    }

    // Notify others in the same category
    const phoneNumbers = await prisma.phoneNumber.findMany({
      where: {
        categories: { has: job.category },
      },
    });

    const notifyOthersPromises = phoneNumbers
      .filter((phone) => phone.name !== workerName)
      .map(async (phone) => {
        const notificationMessage = `${workerName} has claimed the shift at ${job.businessName} on ${shiftStart.toDateString()} from ${job.shift.startTime} to ${job.shift.endTime}.`;

        await fetch('https://textbelt.com/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: phone.number,
            message: notificationMessage,
            key: process.env.TEXTBELT_API_KEY,
          }),
        });
        console.log(`Notification sent to ${phone.number}`);
      });

    await Promise.all(notifyOthersPromises);

    return NextResponse.json({
      message: 'Shift successfully claimed',
      job: updatedJob,
    });
  } catch (error) {
    console.error('Error claiming job:', error);
    return NextResponse.json({ error: 'Failed to claim job' }, { status: 500 });
  }
}
