'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ShiftTimes {
  [key: string]: { start: string; end: string };
  morning: { start: string; end: string };
  midday: { start: string; end: string };
  night: { start: string; end: string };
}

interface PhoneNumber {
  name: string;
  number: string;
  categories: string[];
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([
    { name: '', number: '', categories: [] },
  ]);
  const [shiftTimes, setShiftTimes] = useState<ShiftTimes>({
    morning: { start: '', end: '' },
    midday: { start: '', end: '' },
    night: { start: '', end: '' },
  });

  const handleAddCategory = () => {
    const newCategory = prompt('Enter a new category:');
    if (newCategory && !customCategories.includes(newCategory)) {
      setCustomCategories([...customCategories, newCategory]);
    }
  };

  const handleAddPhoneNumber = () => {
    setPhoneNumbers([...phoneNumbers, { name: '', number: '', categories: [] }]);
  };

  const handlePhoneNumberChange = (
    index: number,
    field: 'name' | 'number',
    value: string
  ) => {
    const updatedPhoneNumbers = [...phoneNumbers];
    updatedPhoneNumbers[index][field] = value;
    setPhoneNumbers(updatedPhoneNumbers);
  };

  const handleCategoryToggle = (phoneIndex: number, category: string) => {
    const updatedPhoneNumbers = [...phoneNumbers];
    const phoneCategories = updatedPhoneNumbers[phoneIndex].categories;

    if (phoneCategories.includes(category)) {
      updatedPhoneNumbers[phoneIndex].categories = phoneCategories.filter(
        (cat) => cat !== category
      );
    } else {
      phoneCategories.push(category);
    }

    setPhoneNumbers(updatedPhoneNumbers);
  };

  const handleShiftTimeChange = (
    shift: keyof ShiftTimes,
    type: 'start' | 'end',
    value: string
  ) => {
    setShiftTimes((prev) => ({
      ...prev,
      [shift]: { ...prev[shift], [type]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validPhoneNumbers = phoneNumbers.filter(
      (phone) => phone.name && phone.number && phone.categories.length > 0
    );

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          phoneNumbers: validPhoneNumbers,
          shiftTimes,
          customCategories,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        alert('Registration successful!');
        router.push('/auth/login');
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Error registering. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md p-6 text-center">
        <h1 className="text-3xl font-bold mb-2">
          <span className="text-[#3a73c1]">SHIFT</span>
          <span className="text-[#52ace4]">GRAB</span>
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 mt-8">
          <input
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            className="w-full px-4 py-3 rounded-full border-2 border-[#3a73c1] text-center text-[#52ace4] placeholder-[#52ace4] focus:outline-none focus:border-[#52ace4]"
          />

          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="w-full px-4 py-3 rounded-full border-2 border-[#3a73c1] text-center text-[#52ace4] placeholder-[#52ace4] focus:outline-none focus:border-[#52ace4]"
          />

          <h2 className="text-xl font-bold text-[#3a73c1] mt-6">Shift Times</h2>
          {Object.keys(shiftTimes).map((shift) => (
            <div key={shift} className="space-y-2">
              <h3 className="text-lg font-semibold text-[#3a73c1] capitalize">
                {shift} Shift
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="time"
                  value={shiftTimes[shift].start}
                  onChange={(e) =>
                    handleShiftTimeChange(
                      shift as keyof ShiftTimes,
                      'start',
                      e.target.value
                    )
                  }
                  className="w-full px-4 py-3 rounded-full border-2 border-[#3a73c1] text-center text-[#52ace4] focus:outline-none"
                />
                <input
                  type="time"
                  value={shiftTimes[shift].end}
                  onChange={(e) =>
                    handleShiftTimeChange(
                      shift as keyof ShiftTimes,
                      'end',
                      e.target.value
                    )
                  }
                  className="w-full px-4 py-3 rounded-full border-2 border-[#3a73c1] text-center text-[#52ace4] focus:outline-none"
                />
              </div>
            </div>
          ))}

          <h2 className="text-xl font-bold text-[#3a73c1] mt-6">
            Add Custom Categories
          </h2>
          <button
            type="button"
            onClick={handleAddCategory}
            className="w-1/3 mx-auto px-4 py-2 rounded-full border-2 border-[#52ace4] text-[#52ace4] font-bold hover:bg-blue-50 transition-colors"
          >
            + Add Category
          </button>
          <ul>
            {customCategories.map((category, index) => (
              <li key={index} className="text-center text-[#3a73c1]">
                {category}
              </li>
            ))}
          </ul>

          <h2 className="text-xl font-bold text-[#3a73c1] mt-6">
            Add Phone Numbers
          </h2>
          {phoneNumbers.map((phone, index) => (
            <div key={index} className="space-y-2">
              <input
                type="text"
                placeholder="Name"
                value={phone.name}
                onChange={(e) =>
                  handlePhoneNumberChange(index, 'name', e.target.value)
                }
                className="w-full px-4 py-3 rounded-full border-2 border-[#3a73c1] text-center text-[#52ace4] placeholder-[#52ace4] focus:outline-none focus:border-[#52ace4]"
              />
              <input
                type="text"
                placeholder="Phone Number"
                value={phone.number}
                onChange={(e) =>
                  handlePhoneNumberChange(index, 'number', e.target.value)
                }
                className="w-full px-4 py-3 rounded-full border-2 border-[#3a73c1] text-center text-[#52ace4] placeholder-[#52ace4] focus:outline-none focus:border-[#52ace4]"
              />
              <div>
                <h3 className="text-lg font-semibold text-[#3a73c1]">
                  Select Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {customCategories.map((category, catIndex) => (
                    <button
                      key={catIndex}
                      type="button"
                      onClick={() => handleCategoryToggle(index, category)}
                      className={`px-4 py-2 rounded-full border-2 ${
                        phone.categories.includes(category)
                          ? 'bg-[#52ace4] text-white'
                          : 'border-[#3a73c1] text-[#3a73c1]'
                      } font-bold`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddPhoneNumber}
            className="w-1/3 mx-auto px-4 py-2 rounded-full border-2 border-[#52ace4] text-[#52ace4] font-bold hover:bg-blue-50 transition-colors"
          >
            + Add Phone Number
          </button>

          <button
            type="submit"
            className="w-full px-4 py-3 rounded-full border-2 border-[#3a73c1] text-[#3a73c1] font-bold hover:bg-[#f0f8ff] transition-colors flex items-center justify-between mt-6"
          >
            <span>REGISTER</span>
            <span>➜</span>
          </button>
        </form>

        <p className="mt-6 text-[#3a73c1] font-bold">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[#52ace4]">
            LOGIN HERE
          </Link>
        </p>
      </div>
    </div>
  );
}
