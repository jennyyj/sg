import { Menu } from 'lucide-react';

interface NavbarProps {
  toggleSidebar: () => void;
}

export default function Navbar({ toggleSidebar }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-sm z-50">
      <button 
        onClick={toggleSidebar}
        className="fixed top-5 left-5 z-[1001] bg-none text-[#3a73c1] border-none cursor-pointer p-2.5"
      >
        <Menu size={24} />
      </button>
    </nav>
  );
}