import React from 'react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { IoLocationSharp, IoTime, IoPeople } from 'react-icons/io5';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

function GameCard({ game, onUpdate }) {
  const { user } = useAuth();
  const isConfirmed = game.players?.confirmed?.some(p => p.user._id === user?._id || p.user === user?._id);
  const confirmedCount = game.players?.confirmed?.length || 0;
  const maxPlayers = game.players?.max || 14;
  const spotsLeft = maxPlayers - confirmedCount;

  const handleConfirm = async (e) => {
    e.stopPropagation();
    try {
      if (isConfirmed) {
        await api.delete(`/games/${game._id}/confirm`);
      } else {
        await api.post(`/games/${game._id}/confirm`);
      }
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-sm text-gray-500">
            {format(new Date(game.dateTime), 'EEEE, d MMMM', { locale: pt })}
          </p>
          <p className="text-xl font-bold text-gray-900">
            {format(new Date(game.dateTime), 'HH:mm')}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          spotsLeft <= 2 
            ? 'bg-red-100 text-red-600' 
            : spotsLeft <= 4 
            ? 'bg-yellow-100 text-yellow-600'
            : 'bg-green-100 text-green-600'
        }`}>
          {spotsLeft > 0 ? `${spotsLeft} vagas` : 'Lotado'}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-gray-600">
          <IoLocationSharp className="w-4 h-4 mr-2 text-gray-400" />
          <span className="text-sm">{game.field?.name}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <IoPeople className="w-4 h-4 mr-2 text-gray-400" />
          <span className="text-sm">{confirmedCount} / {maxPlayers} confirmados</span>
        </div>
        <div className="flex items-center text-gray-600">
          <IoTime className="w-4 h-4 mr-2 text-gray-400" />
          <span className="text-sm">{game.duration || 90} minutos</span>
        </div>
      </div>

      <button
        onClick={handleConfirm}
        className={`w-full py-2.5 px-4 rounded-xl font-medium transition-colors ${
          isConfirmed
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            : 'bg-primary text-white hover:bg-green-600'
        }`}
      >
        {isConfirmed ? 'Cancelar Presença' : 'Confirmar Presença'}
      </button>
    </div>
  );
}

export default GameCard;