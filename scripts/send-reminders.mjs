import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

const sendReminders = async () => {
  try {
    const now = new Date();
    console.log(`Checking for reminders to send at: ${now.toISOString()}`);

    // Find unsent reminders where the sendAt time is due
    const reminders = await prisma.reminder.findMany({
      where: {
        sent: false,
        sendAt: { lte: now },
      },
    });

    if (reminders.length === 0) {
      console.log('No reminders to send at this time.');
      return;
    }

    console.log(`Found ${reminders.length} reminder(s) to send.`);

    for (const reminder of reminders) {
      try {
        // Send SMS via Textbelt
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
          console.error(
            `Failed to send reminder to ${reminder.phoneNumber}:`,
            result.error
          );
        }
      } catch (error) {
        console.error(`Error sending reminder to ${reminder.phoneNumber}:`, error);
      }
    }
  } catch (error) {
    console.error('Error fetching or sending reminders:', error);
  } finally {
    await prisma.$disconnect();
  }
};

// Execute the function
sendReminders();
