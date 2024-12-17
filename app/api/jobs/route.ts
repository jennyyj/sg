import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}`;

type JobRequest = {
  businessName: string;
  jobDescription?: string;
  category: string;
  shift: {
    type: 'MORNING' | 'MIDDAY' | 'NIGHT' | 'CUSTOM';
    date?: string;
    startTime: string;
    endTime: string;
  };
};

export async function POST(request: Request) {
  try {
    const headersList = request.headers;
    const authHeader = headersList.get('authorization');
    const token = authHeader ? authHeader.split(' ')[1] : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
      userId = decoded.id;
    } catch (err) {
      console.error('Invalid token:', err);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as JobRequest;
    const { businessName, jobDescription, category, shift } = body;
    const normalizedCategory = category.toLowerCase();

    if (!businessName || !normalizedCategory || !shift.startTime || !shift.endTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

    const jobData: Prisma.JobCreateInput = {
      businessName,
      jobDescription: jobDescription || '',
      category: normalizedCategory,
      shift: {
        create: {
          type: shift.type,
          date: shift.date ? new Date(shift.date) : new Date(),
          startTime: shift.startTime,
          endTime: shift.endTime,
        },
      },
      user: {
        connect: {
          id: userId,
        },
      },
      status: 'PENDING',
    };

    const job = await prisma.job.create({
      data: jobData,
      include: {
        shift: true,
      },
    });

    const userPhoneNumbers = await prisma.phoneNumber.findMany({
      where: {
        userId: userId,
        categories: {
          has: category.toLowerCase(), 
        },
      },
    });
    

    if (userPhoneNumbers.length === 0) {
      return NextResponse.json({ error: 'No phone numbers found for user' }, { status: 400 });
    }

    const shiftType =
      shift.type === 'MORNING'
        ? 'Morning Shift'
        : shift.type === 'MIDDAY'
        ? 'Midday Shift'
        : shift.type === 'NIGHT'
        ? 'Night Shift'
        : 'Custom Shift';

    const formattedDate = new Date(shift.date || '').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12; // Convert to 12-hour format
      return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const formattedTime = `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`;

    const smsPromises = userPhoneNumbers.map(async (phone) => {
      const optOutLink = `${baseUrl}/opt-out?number=${phone.number}`;
      const smsMessage = `${businessName}
New ${shiftType} Available 
Date: ${formattedDate} 
Time: ${formattedTime} 
Category: ${category}
${jobDescription || ''}
Claim the shift: ${baseUrl}/claim-shift/${job.id}

Want to opt out of these messages? Press here: ${optOutLink}`;

      const response = await fetch('https://textbelt.com/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone.number,
          message: smsMessage,
          key: process.env.TEXTBELT_API_KEY,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        console.error(`Failed to send SMS to ${phone.number}:`, data);
      }
    });

    await Promise.all(smsPromises);

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}

