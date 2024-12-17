import { FileText, Users, Clock, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/auth/login';
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-[999] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full w-[250px] bg-white shadow-lg z-[1000] transition-transform duration-300 ease-in-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="pt-16 flex flex-col h-full">
          <div className="flex-1">
            <Link 
              href="/jobs" 
              className="flex items-center p-5 text-[#3a73c1] hover:bg-[#f0f8ff] transition-colors"
            >
              <FileText className="mr-2.5" size={20} />
              <span>Post Shift</span>
            </Link>
            
            <Link 
              href="/manage-people" 
              className="flex items-center p-5 text-[#3a73c1] hover:bg-[#f0f8ff] transition-colors"
            >
              <Users className="mr-2.5" size={20} />
              <span>Manage People</span>
            </Link>
            
            <Link 
              href="/status" 
              className="flex items-center p-5 text-[#3a73c1] hover:bg-[#f0f8ff] transition-colors"
            >
              <Clock className="mr-2.5" size={20} />
              <span>Shift Status</span>
            </Link>
          </div>

          <div className="border-t border-gray-200 mt-auto">
            <Link 
              href="/settings" 
              className="flex items-center p-5 text-[#3a73c1] hover:bg-[#f0f8ff] transition-colors"
            >
              <Settings className="mr-2.5" size={20} />
              <span>Settings</span>
            </Link>
            
            <button
              onClick={handleLogout}
              className="flex items-center w-full p-5 text-[#3a73c1] hover:bg-[#f0f8ff] transition-colors"
            >
              <LogOut className="mr-2.5" size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}