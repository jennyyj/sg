'use client';

import { useState, useEffect } from 'react';

interface PhoneNumber {
  id: string;
  name: string;
  number: string;
  categories: string[];
  optedOut?: boolean;
}

export default function ManageEmployeesPage() {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<'initial' | 'categories' | 'filtered' | 'add' | 'edit' | 'optedOut'>('initial');
  const [filteredCategory, setFilteredCategory] = useState<string | null>(null);
  const [optedOutNumbers, setOptedOutNumbers] = useState<PhoneNumber[]>([]);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<PhoneNumber | null>(null);
  const [newPhoneNumber, setNewPhoneNumber] = useState({
    name: '',
    number: '',
    categories: [] as string[],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Authorization token missing');
          return;
        }

        // Fetch user data for custom categories
        const userResponse = await fetch('/api/auth/user', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const userData = await userResponse.json();

        if (userResponse.ok) {
          setCustomCategories(userData.user.preferences.customCategories || []);
        } else {
          console.error('Failed to fetch user data:', userData.error);
        }

        // Fetch phone numbers
        const phoneResponse = await fetch('/api/phone-numbers', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const phoneData = await phoneResponse.json();

        if (phoneResponse.ok && phoneData.phoneNumbers) {
          // Separate opted-out numbers
          const optedOut = phoneData.phoneNumbers.filter(
            (phone: PhoneNumber) => phone.optedOut
          );
          const activeNumbers = phoneData.phoneNumbers.filter(
            (phone: PhoneNumber) => !phone.optedOut
          );

          setPhoneNumbers(activeNumbers);
          setOptedOutNumbers(optedOut);
        } else {
          console.error('Failed to fetch phone numbers:', phoneData.error);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleViewAllEmployees = () => {
    setCurrentView('categories');
  };

  const handleViewOptedOutNumbers = () => {
    setCurrentView('optedOut');
  };

  const handleCategoryClick = (category: string) => {
    setFilteredCategory(category);
    setCurrentView('filtered');
  };

  const handleBackToCategories = () => {
    setFilteredCategory(null);
    setCurrentView('categories');
  };

  const handleAddPhoneNumber = () => {
    setCurrentView('add');
    setNewPhoneNumber({ name: '', number: '', categories: [] });
  };

  const handleEditPhoneNumber = (phone: PhoneNumber) => {
    setSelectedPhoneNumber(phone);
    setNewPhoneNumber({ ...phone });
    setCurrentView('edit');
  };

  const handleOptIn = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authorization token missing');
        return;
      }

      const response = await fetch('/api/opt-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'User opted back in successfully!');
      } else {
        alert(data.error || 'Failed to opt user back in.');
      }
    } catch (error) {
      console.error('Error opting back in:', error);
      alert('Error opting back in. Please try again.');
    }
  };

  const handleDeletePhoneNumber = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authorization token missing');
        return;
      }

      const response = await fetch('/api/phone-numbers', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setPhoneNumbers((prev) => prev.filter((phone) => phone.id !== id));
        alert('Phone number deleted successfully');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete phone number');
      }
    } catch (error) {
      console.error('Error deleting phone number:', error);
      alert('Error deleting phone number. Please try again.');
    }
  };

  const handleSavePhoneNumber = async () => {
    if (!newPhoneNumber.name || !newPhoneNumber.number || newPhoneNumber.categories.length === 0) {
      alert('Please fill all fields and select at least one category.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Authorization token missing');
        return;
      }

      const method = currentView === 'add' ? 'POST' : 'PUT';
      const endpoint = '/api/phone-numbers';
      const payload = currentView === 'edit' ? { ...newPhoneNumber, id: selectedPhoneNumber?.id } : newPhoneNumber;

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (currentView === 'add') {
          setPhoneNumbers((prev) => [...prev, data.phoneNumber]);
        } else if (currentView === 'edit') {
          setPhoneNumbers((prev) =>
            prev.map((phone) => (phone.id === data.updatedPhoneNumber.id ? data.updatedPhoneNumber : phone))
          );
        }
        setCurrentView('categories');
      } else {
        console.error('Failed to save phone number:', data.error);
        alert(data.error || 'Failed to save phone number');
      }
    } catch (error) {
      console.error('Error saving phone number:', error);
      alert('Error saving phone number. Please try again.');
    }
  };

  const handleCategorySelection = (category: string) => {
    setNewPhoneNumber((prev) => {
      const updatedCategories = prev.categories.includes(category)
        ? prev.categories.filter((cat) => cat !== category) // Deselect
        : [...prev.categories, category]; // Select
  
      return { ...prev, categories: updatedCategories };
    });
  };
  

  return (
    <div className="container mx-auto p-6 pt-20">
    <h1 className="text-3xl font-bold text-center text-[#3a73c1] mb-4">MANAGE EMPLOYEES</h1>

    {/* Buttons at the top */}
    <div className="flex justify-center space-x-4 mb-4">
      <button
        onClick={handleViewAllEmployees}
        className="px-4 py-2 rounded-full border-2 border-[#3a73c1] text-[#3a73c1] font-bold hover:bg-blue-50 transition-colors"
      >
        VIEW ALL EMPLOYEES
      </button>
      <button
        onClick={handleAddPhoneNumber}
        className="px-4 py-2 rounded-full border-2 border-[#3a73c1] text-[#3a73c1] font-bold hover:bg-blue-50 transition-colors"
      >
        + ADD PHONE NUMBER
      </button>
      <button
          onClick={handleViewOptedOutNumbers}
          className="px-4 py-2 rounded-full border-2 border-[#ff3131] text-[#ff3131] font-bold hover:bg-red-50 transition-colors"
        >
          OPTED OUT NUMBERS
        </button>
    </div>
    {/* Opted Out Numbers View */}
    {currentView === 'optedOut' && (
        <>
          <h2 className="text-xl font-bold text-center text-[#ff3131] mb-6">
            OPTED OUT NUMBERS
          </h2>
          <div className="space-y-4">
            {optedOutNumbers.map((phone) => (
              <div
                key={phone.id}
                className="flex justify-between items-center p-4 bg-white rounded-lg shadow"
              >
                <div>
                  <p className="font-bold text-[#ff3131]">{phone.name}</p>
                  <p className="text-[#3a73c1]">{phone.number}</p>
                </div>
                <button
                onClick={() => handleOptIn(phone.id)}
                className="text-green-500 border border-green-500 px-4 py-2 rounded-full hover:bg-green-100"
              >
                OPT BACK IN
              </button>
              </div>
            ))}
            {optedOutNumbers.length === 0 && (
              <p className="text-center text-[#3a73c1]">No opted-out numbers found.</p>
            )}
          </div>
        </>
      )}

      {currentView === 'categories' && (
        <>
          <h2 className="text-xl font-bold text-center text-[#3a73c1] mb-6">SORT BY: CATEGORIES</h2>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {customCategories.map((category, index) => (
              <button
                key={index}
                onClick={() => handleCategoryClick(category)}
                className="px-4 py-2 rounded-full border-2 border-[#3a73c1] text-[#3a73c1] font-bold hover:bg-blue-50 transition-colors"
              >
                {category.toUpperCase()}
              </button>
            ))}
          </div>
        </>
      )}

      {(currentView === 'add' || currentView === 'edit') && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-center text-[#3a73c1] mb-6">
            {currentView === 'add' ? 'ADD PHONE NUMBER' : 'EDIT PHONE NUMBER'}
          </h2>
          <input
            type="text"
            placeholder="Name"
            value={newPhoneNumber.name}
            onChange={(e) => setNewPhoneNumber({ ...newPhoneNumber, name: e.target.value })}
            className="w-full px-4 py-3 rounded-full border-2 border-[#3a73c1] text-center text-[#52ace4] placeholder-[#52ace4] focus:outline-none"
          />
          <input
            type="text"
            placeholder="Phone Number"
            value={newPhoneNumber.number}
            onChange={(e) => setNewPhoneNumber({ ...newPhoneNumber, number: e.target.value })}
            className="w-full px-4 py-3 rounded-full border-2 border-[#3a73c1] text-center text-[#52ace4] placeholder-[#52ace4] focus:outline-none"
          />
          <div className="space-y-2">
  <h3 className="text-lg font-bold text-[#3a73c1]">Select Categories</h3>
  <div className="flex flex-wrap gap-2">
    {customCategories.map((category, index) => (
      <button
        key={index}
        onClick={() => handleCategorySelection(category)}
        className={`px-4 py-2 rounded-full font-bold ${
          newPhoneNumber.categories.includes(category)
            ? 'border-2 border-[#3a73c1] bg-[#f0f8ff] text-[#3a73c1]'
            : 'border-2 border-[#3a73c1] text-[#3a73c1]'
        } font-bold hover:bg-[#f0f8ff] hover:text-[#3a73c1] transition-colors`}
      >
        {category.toUpperCase()}
      </button>
    ))}
  </div>
</div>
          <button
            onClick={handleSavePhoneNumber}
            className="w-full px-4 py-2 rounded-full border-2 border-[#3a73c1] text-[#3a73c1] font-bold hover:bg-[#f0f8ff] transition-colors"
          >
            {currentView === 'add' ? 'SAVE' : 'UPDATE'}
          </button>
        </div>
      )}

      {currentView === 'filtered' && filteredCategory && (
        <>
          <button
            onClick={handleBackToCategories}
            className="mb-4 px-4 py-2 rounded-full border-2 border-[#3a73c1] text-[#3a73c1] font-bold hover:bg-[#f0f8ff] transition-colors"
          >
            BACK TO CATEGORIES
          </button>
          <h2 className="text-xl font-bold text-center text-[#3a73c1] mb-6">
            CATEGORY: {filteredCategory.toUpperCase()}
          </h2>
          <div className="space-y-4">
            {phoneNumbers
              .filter((phone) => phone.categories.includes(filteredCategory))
              .map((phone) => (
                <div
                  key={phone.id}
                  className="flex justify-between items-center p-4 bg-white rounded-lg shadow"
                >
                  <div>
                    <p className="font-bold text-[#3a73c1]">{phone.name}</p>
                    <p className="text-[#52ace4]">{phone.number}</p>
                    <p className="text-sm text-[#52ace4]">Categories: {phone.categories.join(', ')}</p>
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleEditPhoneNumber(phone)}
                      className="text-[#ff914d] border border-[#ff914d] px-4 py-2 rounded-full hover:bg-[#fff1e9]"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => handleDeletePhoneNumber(phone.id)}
                      className="text-[#ff3131] border border-[#ff3131] px-4 py-2 rounded-full hover:bg-[#fff1f1]"
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
