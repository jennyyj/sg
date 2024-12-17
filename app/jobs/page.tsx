'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../../styles/calendar-styles.css';

function formatTimeTo12Hour(time: string | undefined): string {
  if (!time) return ''; // Handle undefined or empty time
  const [hours, minutes] = time.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return ''; // Handle invalid time format
  const period = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12; // Convert to 12-hour format
  return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

interface ShiftTimes {
  morning: { start: string; end: string };
  midday: { start: string; end: string };
  night: { start: string; end: string };
}

interface JobData {
  businessName: string;
  jobDescription: string;
  category: string;
  shift: {
    type: 'CUSTOM' | 'MORNING' | 'MIDDAY' | 'NIGHT';
    date: string;
    startTime: string;
    endTime: string;
  };
}

export default function PostJobPage() {
  const router = useRouter();
  const [jobData, setJobData] = useState<JobData>({
    businessName: '',
    jobDescription: '',
    category: '',
    shift: {
      type: 'CUSTOM',
      date: '',
      startTime: '',
      endTime: '',
    },
  });

  const [user, setUser] = useState<any>(null);
  const [predefinedShifts, setPredefinedShifts] = useState<ShiftTimes>({
    morning: { start: '', end: '' },
    midday: { start: '', end: '' },
    night: { start: '', end: '' },
  });
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Authorization token missing');
          return;
        }

        const response = await fetch('/api/auth/user', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          const { user } = data;

          setUser(user);

          // Update jobData with business/username
          setJobData((prevJobData) => ({
            ...prevJobData,
            businessName: user.businessName || user.username || '',
          }));

          // Update predefinedShifts and customCategories in state
          setPredefinedShifts(user.preferences.shiftTimes || {});
          setCustomCategories(user.preferences.customCategories || []);
        } else {
          console.error('Failed to fetch user data:', data.error);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleDateChange = (value: Date | Date[] | null) => {
    if (value instanceof Date) {
      const normalizedDate = new Date(
        value.getFullYear(),
        value.getMonth(),
        value.getDate()
      );
      setJobData({
        ...jobData,
        shift: {
          ...jobData.shift,
          date: normalizedDate.toISOString().split('T')[0],
        },
      });
    }
  };

  const handleShiftTypeChange = (type: string) => {
    const selectedShift = predefinedShifts[type.toLowerCase() as keyof ShiftTimes] || { start: '', end: '' };

    setJobData({
      ...jobData,
      shift: {
        ...jobData.shift,
        type,
        startTime: selectedShift.start,
        endTime: selectedShift.end,
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobData.businessName || !jobData.category) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You need to log in first');
        return;
      }

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(jobData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('lastPostedJobId', data.job.id);
        router.push('/status');
      } else {
        alert(data.error || 'Error posting job');
      }
    } catch (error) {
      console.error('Error posting job:', error);
      alert('Error posting job. Please try again.');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 pt-16">
      <h1 className="text-3xl font-bold text-center text-[#3a73c1] mb-2">
        POST A SHIFT
      </h1>

      <h2 className="text-lg font-semibold text-center text-[#3a73c1] mb-6">
        {jobData.businessName || 'Business Name'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-4 rounded-xl flex justify-center items-center flex-col">
          <h2 className="text-center text-[#3a73c1] mb-4">Select a Date</h2>
          <ReactCalendar
            selectRange={false}
            onChange={(value) => handleDateChange(value as Date | null)}
            value={jobData.shift.date ? new Date(jobData.shift.date) : new Date()}
            next2Label={null}
            prev2Label={null}
          />
        </div>

        <div className="p-4 rounded-xl">
          <h2 className="text-center text-[#3a73c1] mb-2">Select Shift Time</h2>
          <select
            value={jobData.shift.type}
            onChange={(e) => handleShiftTypeChange(e.target.value)}
            className="w-full px-4 py-3 rounded-full border-2 border-[#3a73c1] text-center text-[#52ace4] focus:outline-none"
          >
            <option value="CUSTOM">Custom</option>
            {Object.keys(predefinedShifts).map((shift) => (
              <option key={shift} value={shift.toUpperCase()}>
                {`${shift.charAt(0).toUpperCase() + shift.slice(1)} (${formatTimeTo12Hour(
                  predefinedShifts[shift].start
                )} - ${formatTimeTo12Hour(predefinedShifts[shift].end)})`}
              </option>
            ))}
          </select>

          {jobData.shift.type === 'CUSTOM' && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <input
                type="time"
                value={jobData.shift.startTime}
                onChange={(e) =>
                  setJobData({
                    ...jobData,
                    shift: { ...jobData.shift, startTime: e.target.value },
                  })
                }
                className="w-full px-4 py-3 rounded-full border-2 border-[#3a73c1] text-center text-[#52ace4] focus:outline-none"
              />
              <input
                type="time"
                value={jobData.shift.endTime}
                onChange={(e) =>
                  setJobData({
                    ...jobData,
                    shift: { ...jobData.shift, endTime: e.target.value },
                  })
                }
                className="w-full px-4 py-3 rounded-full border-2 border-[#3a73c1] text-center text-[#52ace4] focus:outline-none"
              />
            </div>
          )}
        </div>

        <select
          value={jobData.category}
          onChange={(e) => setJobData({ ...jobData, category: e.target.value })}
          className="w-full px-4 py-3 rounded-full border-2 border-[#3a73c1] text-center text-[#52ace4] focus:outline-none"
        >
          <option value="">Select Category</option>
          {customCategories.map((category, index) => (
            <option key={index} value={category}>
              {category}
            </option>
          ))}
        </select>

        <textarea
          placeholder="Job Description (Optional)"
          value={jobData.jobDescription}
          onChange={(e) =>
            setJobData({ ...jobData, jobDescription: e.target.value })
          }
          className="w-full px-4 py-3 rounded-2xl border-2 border-[#3a73c1] text-center text-[#52ace4] placeholder-[#52ace4] focus:outline-none min-h-[100px]"
        />

        <button
          type="submit"
          className="w-full px-4 py-3 rounded-full border-2 border-[#3a73c1] text-[#3a73c1] font-bold hover:bg-[#f0f8ff] transition-colors"
        >
          POST SHIFT
        </button>
      </form>
    </div>
  );
}
