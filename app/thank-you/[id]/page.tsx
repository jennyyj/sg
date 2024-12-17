'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Job {
  id: string;
  businessName: string;
  jobDescription: string;
  category: string;
  shift: {
    type: string;
    date: string;
    startTime: string;
    endTime: string;
  };
}

export default function ThankYouPage() {
  const [job, setJob] = useState<Job | null>(null);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const fetchJob = async () => {
      if (!params?.id) return;

      try {
        const response = await fetch(`/api/jobs/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setJob(data.job);
        } else {
          console.error('Job not found');
        }
      } catch (error) {
        console.error('Error fetching job details:', error);
      }
    };

    fetchJob();
  }, [params.id]);

  const handleUnclaimShift = async () => {
    try {
      const response = await fetch('/api/unclaim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId: params.id }),
      });

      if (response.ok) {
        alert('Shift successfully unclaimed!');
        router.push(`/claim-shift/${params.id}`); 
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to unclaim the shift');
      }
    } catch (error) {
      console.error('Error unclaiming the shift:', error);
    }
  };

  if (!job) return <p>Loading...</p>;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-3xl mx-auto text-center p-6 space-y-8">
      <h1 className="text-2xl font-bold text-[#3a73c1]">THANK YOU FOR CLAIMING THE SHIFT!</h1>
      <div>
        <h2 className="text-lg font-bold text-[#3a73c1] mb-4">SHIFT DETAILS</h2>
        <div className="text-[#52ace4] space-y-2 text-sm">
          <p><strong>Business Name:</strong> {job.businessName}</p>
          <p><strong>Date:</strong> {formatDate(job.shift.date)}</p>
          <p><strong>Time:</strong> {formatTime(job.shift.startTime)} - {formatTime(job.shift.endTime)}</p>
          <p><strong>Category:</strong> {job.category}</p>
          <p><strong>Job Description:</strong> {job.jobDescription || 'None'}</p>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold text-[#3a73c1]">PLANS CHANGED?</h2>
        <p className="text-sm text-[#3a73c1]">UNCLAIM BELOW</p>
        <button
          className="w-full max-w-sm mx-auto px-6 py-3 mt-4 rounded-full border-2 border-[#ff3131] text-[#ff3131] font-bold hover:bg-[#fff1f1] hover:text-red transition-colors"
          onClick={handleUnclaimShift}
        >
          Unclaim Shift
        </button>
      </div>
    </div>
  );
}
