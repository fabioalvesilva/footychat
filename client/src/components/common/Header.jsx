import React from 'react';
import { HiArrowLeft, HiBell } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

function Header({ title, showBack = false, showNotifications = false }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="mr-3 p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <HiArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        </div>
        
        {showNotifications && (
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors relative">
            <HiBell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;