import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/admin/Sidebar';
import { Menu } from 'lucide-react';
import CommandMenu from '../components/admin/CommandMenu';
import soloLogoBlanco from '../assets/Jerusalén/solo logo blanco.svg';
import ThemeToggle from '../components/common/ThemeToggle';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-800 dark:text-gray-100 relative overflow-hidden transition-colors duration-500">
      {/* Sidebar overlay for mobile when open */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen md:pl-64 overflow-x-hidden overflow-y-auto">
        {/* Mobile Top Header */}
        <header className="md:hidden bg-primary text-white p-4 flex items-center justify-between shadow-sm z-30">
          <div className="flex items-center gap-2">
            <img src={soloLogoBlanco} alt="Logo" className="h-6 w-auto" />
            <h2 className="font-serif text-base font-bold">Iglesia Jerusalén</h2>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-1 rounded hover:bg-white/10 transition-colors cursor-pointer text-white"
              aria-label="Abrir menú"
            >
              <Menu size={24} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandMenu />
    </div>
  );
};

export default AdminLayout;
