import React, { useState } from 'react';
import { IoPersonCircle, IoCall, IoMail, IoLocationSharp, IoLogOut, IoFootball, IoTrophy, IoTime } from 'react-icons/io5';
import Header from '../components/common/Header';
import { useAuth } from '../contexts/AuthContext';

function ProfilePage() {
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
  };

  const stats = [
    { icon: IoFootball, label: 'Jogos', value: user?.stats?.gamesPlayed || 0 },
    { icon: IoTrophy, label: 'Golos', value: user?.stats?.goals || 0 },
    { icon: IoTime, label: 'Assistências', value: user?.stats?.assists || 0 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Perfil" />

      <main className="px-4 py-6">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl p-6 mb-4">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-green-600 rounded-full flex items-center justify-center mb-4">
              <IoPersonCircle className="w-20 h-20 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{user?.phoneNumber}</p>
            {user?.email && (
              <p className="text-sm text-gray-500">{user.email}</p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Info Sections */}
        <div className="bg-white rounded-2xl divide-y divide-gray-100">
          <div className="p-4 flex items-center">
            <IoCall className="w-5 h-5 text-gray-400 mr-3" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Telemóvel</p>
              <p className="font-medium text-gray-900">{user?.phoneNumber}</p>
            </div>
          </div>

          {user?.email && (
            <div className="p-4 flex items-center">
              <IoMail className="w-5 h-5 text-gray-400 mr-3" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{user.email}</p>
              </div>
            </div>
          )}

          {user?.location?.city && (
            <div className="p-4 flex items-center">
              <IoLocationSharp className="w-5 h-5 text-gray-400 mr-3" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Cidade</p>
                <p className="font-medium text-gray-900">{user.location.city}</p>
              </div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full mt-6 bg-red-50 text-red-600 font-medium py-3 px-4 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center"
        >
          <IoLogOut className="w-5 h-5 mr-2" />
          Terminar Sessão
        </button>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Terminar Sessão?</h3>
            <p className="text-gray-500 mb-6">Tens a certeza que queres sair?</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;