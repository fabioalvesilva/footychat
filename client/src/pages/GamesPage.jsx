import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import GameCard from '../components/games/GameCard';
import api from '../services/api';

function GamesPage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming'); // upcoming, past, all

  useEffect(() => {
    fetchGames();
  }, [filter]);

  const fetchGames = async () => {
    setLoading(true);
    try {
      const params = filter === 'upcoming' ? '?upcoming=true' : '';
      const res = await api.get(`/games${params}`);
      setGames(res.data.games);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Jogos" showNotifications />
      
      {/* Filtros */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('upcoming')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              filter === 'upcoming' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500'
            }`}
          >
            Próximos
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              filter === 'past' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500'
            }`}
          >
            Anteriores
          </button>
        </div>
      </div>

      <main className="px-4 py-4">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">A carregar jogos...</p>
          </div>
        ) : games.length > 0 ? (
          <div className="space-y-3">
            {games.map(game => (
              <GameCard key={game._id} game={game} onUpdate={fetchGames} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 text-center">
            <p className="text-gray-500">
              {filter === 'upcoming' ? 'Não há jogos agendados' : 'Não há jogos anteriores'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default GamesPage;