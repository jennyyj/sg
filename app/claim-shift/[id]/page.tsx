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

interface PhoneNumber {
  id: string;
  name: string;
  number: string;
}

export default function ClaimJobPage() {
  const [job, setJob] = useState<Job | null>(null);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [filteredNumbers, setFilteredNumbers] = useState<PhoneNumber[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const fetchJobAndPhoneNumbers = async () => {
      if (!params?.id) return;

      try {
        const jobResponse = await fetch(`/api/jobs/${params.id}`);
        if (jobResponse.ok) {
          const jobData = await jobResponse.json();
          setJob(jobData.job);

          const phoneResponse = await fetch(
            `/api/public-phone-numbers?category=${jobData.job.category}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            }
          );

          if (phoneResponse.ok) {
            const phoneData = await phoneResponse.json();
            setPhoneNumbers(phoneData.phoneNumbers || []);
          } else {
            console.error('Failed to fetch phone numbers');
          }
        } else {
          console.error('Job not found');
        }
      } catch (error) {
        console.error('Error fetching job and phone numbers:', error);
      }
    };

    fetchJobAndPhoneNumbers();
  }, [params.id]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (query.length > 0) {
      setFilteredNumbers(
        phoneNumbers.filter(
          (phone) =>
            phone.name.toLowerCase().includes(query.toLowerCase()) ||
            phone.number.includes(query)
        )
      );
    } else {
      setFilteredNumbers([]);
    }
  };

  const handleClaimJob = async () => {
    if (!selectedName) {
      alert('Please select your name to claim the job');
      return;
    }

    try {
      const response = await fetch('/api/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: params.id,
          workerName: selectedName,
        }),
      });

      if (response.ok) {
        alert('Job successfully claimed!');
        router.push(`/thank-you/${params.id}`);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to claim the job');
      }
    } catch (error) {
      console.error('An error occurred while claiming the job:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  };

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-2xl mx-auto text-center p-6 space-y-8">
      <h1 className="text-3xl font-bold text-[#3a73c1]">CLAIM SHIFT</h1>
      {job ? (
        <>
          <h2 className="text-lg font-bold text-[#3a73c1]">SHIFT DETAILS</h2>
          <div className="text-[#52ace4] space-y-2 text-sm">
            <p><strong>Business Name:</strong> {job.businessName}</p>
            <p><strong>Date:</strong> {formatDate(job.shift.date)}</p>
            <p><strong>Time:</strong> {formatTime(job.shift.startTime)} - {formatTime(job.shift.endTime)}</p>
            <p><strong>Category:</strong> {job.category}</p>
            <p><strong>Job Description:</strong> {job.jobDescription || 'None'}</p>
          </div>

          <input
            type="text"
            placeholder="Search for name or phone number"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-full border-2 border-[#3a73c1] text-center text-[#52ace4] placeholder-[#52ace4] focus:outline-none"
          />

          <div className="space-y-2">
            {filteredNumbers.map((phone) => (
              <button
                key={phone.id}
                onClick={() => setSelectedName(phone.name)}
                className={`w-full px-4 py-2 rounded-full ${
                  selectedName === phone.name
                    ? 'border-2 border-[#52ace4] bg-[#f0f8ff] text-[#52ace4]'
                    : 'border-2 border-[#3a73c1] text-[#3a73c1]'
                } font-bold hover:bg-[#f0f8ff] transition-colors`}
              >
                {phone.name} ({phone.number})
              </button>
            ))}
          </div>

          <button
            className="w-full px-4 py-3 rounded-full border-2 border-[#3a73c1] text-[#3a73c1] font-bold hover:bg-[#f0f8ff] transition-colors"
            onClick={handleClaimJob}
          >
            CLAIM SHIFT
          </button>
        </>
      ) : (
        <p>Loading job details...</p>
      )}
    </div>
  );
}
