import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

const sendReminders = async () => {
  try {
    const now = new Date();

    // Fetch unsent reminders that are due
    const reminders = await prisma.reminder.findMany({
      where: {
        sent: false,
        sendAt: { lte: now },
      },
    });

    for (const reminder of reminders) {
      const response = await fetch('https://textbelt.com/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: reminder.phoneNumber,
          message: reminder.message,
          key: process.env.TEXTBELT_API_KEY,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log(`Reminder sent to ${reminder.phoneNumber}`);
        // Mark the reminder as sent
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { sent: true },
        });
      } else {
        console.error(`Failed to send reminder to ${reminder.phoneNumber}:`, result.error);
      }
    }
  } catch (error) {
    console.error('Error sending reminders:', error);
  } finally {
    await prisma.$disconnect();
  }
};

// Run the script
sendReminders();
