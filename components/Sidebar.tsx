import React, { useState } from 'react';
import type { View } from '../types';
import { DashboardIcon } from './icons/DashboardIcon';
import { ClothingIcon } from './icons/ClothingIcon';
import { CustomerIcon } from './icons/CustomerIcon';
import { RentalIcon } from './icons/RentalIcon';
import { XIcon } from './icons/XIcon';
import { AdminIcon } from './icons/AdminIcon';
import { Modal } from './shared/Modal';

interface SidebarProps {
  view: View;
  setView: (view: View) => void;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  onAdminReset: () => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-4 py-3 w-full text-left rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-primary-600 text-white'
        : 'text-gray-300 hover:bg-primary-700 hover:text-white'
    }`}
  >
    {icon}
    <span className="mx-4 font-medium">{label}</span>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ view, setView, isOpen, setOpen, onAdminReset }) => {
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [password, setPassword] = useState('');

  const handleNavClick = (newView: View) => {
    setView(newView);
    if(window.innerWidth < 768) {
      setOpen(false);
    }
  };

  const handleAdminReset = () => {
    if (password === 'Tam@0707') {
      // FIX: The native browser `confirm()` dialog is unreliable in some environments.
      // The modal itself provides enough warning, so the extra confirmation is removed.
      onAdminReset();
      alert('Toàn bộ dữ liệu đã được xóa.');
      setIsAdminModalOpen(false);
      setPassword('');
    } else {
      alert('Mật khẩu không đúng.');
      setPassword('');
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Bảng Điều Khiển', icon: <DashboardIcon /> },
    { id: 'clothing', label: 'Quần Áo', icon: <ClothingIcon /> },
    { id: 'customers', label: 'Khách Hàng', icon: <CustomerIcon /> },
    { id: 'rentals', label: 'Lượt Thuê', icon: <RentalIcon /> },
  ] as const;

  return (
    <>
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden ${isOpen ? 'block' : 'hidden'}`} onClick={() => setOpen(false)}></div>
      <div className={`fixed md:relative inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out bg-primary-900 text-white w-64 space-y-6 py-7 px-2 z-30 flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between px-4 mb-10">
              <h2 className="text-2xl font-extrabold text-white">Thuê Đồ UI</h2>
               <button onClick={() => setOpen(false)} className="md:hidden p-1 rounded-md hover:bg-primary-700">
                 <XIcon />
               </button>
            </div>
            <nav>
              {navItems.map((item) => (
                <NavItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  isActive={view === item.id}
                  onClick={() => handleNavClick(item.id)}
                />
              ))}
            </nav>
          </div>
          <div className="px-4 py-2 text-center text-sm text-gray-400">
             © {new Date().getFullYear()} Cửa Hàng Thuê Đồ
             <button
                onClick={() => setIsAdminModalOpen(true)}
                className="ml-2 p-1 text-gray-400 hover:text-white transition-colors"
                title="Admin Settings"
             >
                <AdminIcon className="inline-block h-4 w-4" />
             </button>
          </div>
      </div>
      
      <Modal 
        isOpen={isAdminModalOpen} 
        onClose={() => setIsAdminModalOpen(false)} 
        title="Admin: Reset Dữ Liệu"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Nhập mật khẩu để reset toàn bộ dữ liệu của ứng dụng về trạng thái ban đầu.
          </p>
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <p className="text-sm font-bold text-red-600 dark:text-red-300 text-center">
              CẢNH BÁO: Hành động này không thể hoàn tác.
            </p>
          </div>
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu admin"
            className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button 
              type="button" 
              onClick={() => { setIsAdminModalOpen(false); setPassword(''); }} 
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              Hủy
            </button>
            <button 
              type="button" 
              onClick={handleAdminReset} 
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Xác nhận & Reset
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};