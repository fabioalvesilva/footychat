import React from 'react';
import { NavLink } from 'react-router-dom';
import { HiHome, HiUserGroup, HiUser } from 'react-icons/hi';
import { IoFootball } from 'react-icons/io5';

function BottomNav() {
  const navItems = [
    { path: '/', icon: HiHome, label: 'Início' },
    { path: '/games', icon: IoFootball, label: 'Jogos' },
    { path: '/groups', icon: HiUserGroup, label: 'Grupos' },
    { path: '/profile', icon: HiUser, label: 'Perfil' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16 bottom-nav">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-primary' : 'text-gray-400'
              }`
            }
          >
            <Icon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default BottomNav;