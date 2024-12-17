'use client';

import { useState, useEffect } from 'react';

interface ShiftTimes {
  morning: { start: string; end: string };
  midday: { start: string; end: string };
  night: { start: string; end: string };
}

export default function SettingsPage() {
  const [shiftTimes, setShiftTimes] = useState<ShiftTimes>({
    morning: { start: '', end: '' },
    midday: { start: '', end: '' },
    night: { start: '', end: '' },
  });

  const [categories, setCategories] = useState<string[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await fetch('/api/settings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to fetch settings:', error.error);
        return;
      }

      const data = await response.json();
      if (data.preferences) {
        setShiftTimes(data.preferences.shiftTimes || shiftTimes);
        setCategories(data.preferences.customCategories || []);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleAddCategory = () => {
    setCategories([...categories, '']);
  };

  const handleRemoveCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (index: number, value: string) => {
    const updatedCategories = [...categories];
    updatedCategories[index] = value;
    setCategories(updatedCategories);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You need to log in first');
        return;
      }

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shiftTimes,
          username,
          password,
          customCategories: categories,
        }),
      });

      if (response.ok) {
        alert('Settings saved successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    }
  };

  return (
    <div className="container mx-auto p-6 pt-20">
      <h1 className="text-3xl font-bold text-center text-[#3a73c1] mb-8">SETTINGS</h1>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Shift Times */}
        <div>
          <h2 className="text-xl font-semibold text-[#3a73c1] mb-6 text-center">SET YOUR SHIFT TIMES</h2>
          {Object.entries(shiftTimes).map(([shift, times]) => (
            <div key={shift} className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-[#3a73c1] capitalize">{shift} (AM, PM)</h3>
              <div className="flex space-x-4">
                <input
                  type="time"
                  value={times.start}
                  onChange={(e) =>
                    setShiftTimes((prev) => ({
                      ...prev,
                      [shift]: { ...prev[shift], start: e.target.value },
                    }))
                  }
                  className="px-6 py-3 rounded-full border-2 border-[#3a73c1] p-2 rounded text-[#52ace4] text-center w-85"
                />
                <input
                  type="time"
                  value={times.end}
                  onChange={(e) =>
                    setShiftTimes((prev) => ({
                      ...prev,
                      [shift]: { ...prev[shift], end: e.target.value },
                    }))
                  }
                  className="px-6 py-3 rounded-full border-2 border-[#3a73c1] p-2 rounded text-[#52ace4] text-center w-85"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Categories */}
        <div>
          <h2 className="text-xl font-semibold text-[#3a73c1] mb-6 text-center">MANAGE YOUR CATEGORIES</h2>
          <div className="space-y-4">
            {categories.map((category, index) => (
              <div key={index} className="flex items-center text-[#52ace4] justify-between">
                <input
                  type="text"
                  value={category}
                  onChange={(e) => handleCategoryChange(index, e.target.value)}
                  className="px-6 py-3 rounded-full border-2 border-[#3a73c1] p-2 rounded text-center flex-1 mr-4"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(index)}
                  className="text-[#ff3131] border border-[#ff3131] px-4 py-2 rounded-full hover:bg-[#fff1f1]"
                >
                  REMOVE
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddCategory}
            className="block mx-auto mt-4 px-4 py-2 rounded-full border border-[#3a73c1] text-[#3a73c1] hover:bg-[#f0f8ff] transition"
          >
            ADD NEW CATEGORY
          </button>
        </div>

        {/* Username and Password */}
        <div>
          <h2 className="text-xl font-semibold text-[#3a73c1] mb-6 text-center">CHANGE USERNAME OR PASSWORD</h2>
          <div className="flex flex-col items-center text-[#52ace4] space-y-4">
            <input
              type="text"
              placeholder="New Business Name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="px-6 py-3 rounded-full border-2 border-[#3a73c1] p-2 rounded w-64 text-[#52ace4] text-center"
            />
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-6 py-3 rounded-full border-2 border-[#3a73c1] p-2 rounded w-64 text-[#52ace4] text-center"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="text-center">
          <button
            type="submit"
            className="w-full px-6 py-3 rounded-full border-2 border-[#3a73c1] text-[#3a73c1] font-bold text-lg hover:bg-[#f0f8ff] transition"
          >
            SAVE SETTINGS
          </button>
        </div>
      </form>
    </div>
  );
}
