'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Job {
  id: string;
  businessName: string;
  category: string;
  status: 'PENDING' | 'CLAIMED' | 'REMOVED' | 'UNCLAIMED'; 
  shift: {
    type: string;
    date: string;
    startTime: string;
    endTime: string;
  };
  claimedBy?: string;
  jobDescription?: string;
}

export default function StatusPage() {
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [pastJobs, setPastJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const router = useRouter();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth/login');
          return;
        }
  
        const response = await fetch('/api/status', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        const data = await response.json();
  
        if (response.ok && data.jobs) {
          const [recent, ...past] = data.jobs;
          setCurrentJob(recent);
          setPastJobs(past);
          setFilteredJobs(past);
        } else {
          console.error('Failed to fetch jobs:', data.error);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
      }
    };
  
    fetchJobs();
  }, [router]);
  

  const handleFilterChange = (filterType: string) => {
    setFilter(filterType);
  
    if (filterType === 'ALL') {
      setFilteredJobs(pastJobs);
    } else {
      setFilteredJobs(
        pastJobs.filter((job) => job.status.toUpperCase() === filterType)
      );
    }
  };
  

  const handleRemoveShift = async (jobId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You need to log in first');
        return;
      }

      const response = await fetch(`/api/status`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobId }),
      });

      if (response.ok) {
        alert('Shift removed successfully!');
        setCurrentJob(null); // Clear the current job
        setPastJobs(pastJobs.filter((job) => job.id !== jobId));
      } else {
        alert('Failed to remove shift');
      }
    } catch (error) {
      console.error('Error removing shift:', error);
      alert('Error removing shift. Please try again.');
    }
  };

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto p-4 pt-20">
      <h1 className="text-3xl font-bold text-center text-[#3a73c1] mb-8">
        SHIFT UPDATES
      </h1>

      {currentJob && (
  <div className="bg-white rounded-lg shadow p-6 mb-8">
    <h2 className="text-xl font-bold text-[#3a73c1] mb-4">Posted Shift</h2>
    <div className="space-y-2 text-[#52ace4]">
      <p><strong>Date:</strong> {formatDate(currentJob.shift.date)}</p>
      <p><strong>Time:</strong> {formatTime(currentJob.shift.startTime)} - {formatTime(currentJob.shift.endTime)}</p>
      <p><strong>Category:</strong> {currentJob.category}</p>
      <p><strong>Job Description:</strong> {currentJob.jobDescription || 'None'}</p>
      <p>
        <strong>Status:</strong>{' '}
        <span
          className={`font-bold ${
            currentJob.status === 'CLAIMED'
              ? 'text-green-500'
              : currentJob.status === 'REMOVED'
              ? 'text-red-500'
              : 'text-[#52ace4]'
          }`}
        >
          {currentJob.status}
        </span>
      </p>
      {currentJob.status === 'CLAIMED' && (
        <p>
          <strong>Claimed By:</strong> {currentJob.claimedBy || 'Unknown'}
        </p>
      )}
    </div>
    <button
      onClick={() => handleRemoveShift(currentJob.id)}
      className="mt-4 px-4 py-2 rounded-full border-2 border-[#ff3131] text-[#ff3131] font-bold hover:bg-[#fff1f1] transition-colors"
    >
      Remove Shift
    </button>
  </div>
)}

      <h2 className="text-xl font-bold text-[#3a73c1] mb-4">Past Shift Information</h2>
      <div className="flex space-x-4 mb-4 justify-center">
  {['ALL', 'CLAIMED', 'UNCLAIMED', 'REMOVED'].map((type) => (
    <button
      key={type}
      onClick={() => handleFilterChange(type)}
      className={`px-4 py-2 rounded-full ${
        filter === type
          ? 'border-2 border-[#3a73c1] bg-[#f0f8ff] text-[#3a73c1]'
          : 'border-2 border-[#3a73c1] text-[#3a73c1]'
      } font-bold hover:bg-[#f0f8ff] hover:text-[#3a73c1] transition-colors`}
    >
      {type === 'ALL' ? 'All Past Shifts' : `${type} Shifts`}
    </button>
  ))}
</div>

{filteredJobs.map((job) => (
  <div key={job.id} className="bg-white rounded-lg shadow p-4 mb-4">
    <div className="space-y-2 text-[#52ace4]">
      <p><strong>Date:</strong> {formatDate(job.shift.date)}</p>
      <p><strong>Time:</strong> {formatTime(job.shift.startTime)} - {formatTime(job.shift.endTime)}</p>
      <p><strong>Category:</strong> {job.category}</p>
      <p><strong>Job Description:</strong> {job.jobDescription || 'None'}</p>
      <p>
        <strong>Status:</strong>{' '}
        <span
          className={`font-bold ${
            job.status === 'CLAIMED'
              ? 'text-green-500'
              : job.status === 'REMOVED'
              ? 'text-red-500'
              : 'text-[#ff914d]'
          }`}
        >
          {job.status}
        </span>
      </p>
      {job.status === 'CLAIMED' && (
        <p>
          <strong>Claimed By:</strong> {job.claimedBy || 'Unknown'}
        </p>
      )}
    </div>
  </div>
))}

    </div>
  );
}
