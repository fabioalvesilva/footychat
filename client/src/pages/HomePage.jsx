import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, isToday, isTomorrow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { IoFootball, IoLocationSharp, IoTime, IoPeople } from 'react-icons/io5';
import { HiChevronRight } from 'react-icons/hi';
import Header from '../components/common/Header';
import GameCard from '../components/games/GameCard';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function HomePage() {
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [gamesRes, groupsRes] = await Promise.all([
        api.get('/games?upcoming=true'),
        api.get('/groups')
      ]);
      setGames(gamesRes.data.games.slice(0, 3)); // Só mostrar 3 próximos jogos
      setGroups(groupsRes.data.groups);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateLabel = (date) => {
    const gameDate = new Date(date);
    if (isToday(gameDate)) return 'Hoje';
    if (isTomorrow(gameDate)) return 'Amanhã';
    return format(gameDate, 'EEE, d MMM', { locale: pt });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={`Olá, ${user?.name?.split(' ')[0]}!`} showNotifications />

      <main className="px-4 py-4 space-y-6">
        {/* Próximo Jogo */}
        {games.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Próximo Jogo</h2>
            <Link to="/games">
              <div className="bg-gradient-to-r from-primary to-green-600 rounded-2xl p-4 text-white">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-white/90 text-sm">{getDateLabel(games[0].dateTime)}</p>
                    <p className="text-2xl font-bold">
                      {format(new Date(games[0].dateTime), 'HH:mm')}
                    </p>
                  </div>
                  <IoFootball className="w-8 h-8 text-white/80" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-white/90">
                    <IoLocationSharp className="w-4 h-4 mr-2" />
                    <span className="text-sm">{games[0].field?.name}</span>
                  </div>
                  <div className="flex items-center text-white/90">
                    <IoPeople className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      {games[0].players?.confirmed?.length || 0} / {games[0].players?.max} confirmados
                    </span>
                  </div>
                </div>

                <div className="mt-4 bg-white/20 rounded-xl p-3">
                  <p className="text-sm font-medium">
                    {games[0].players?.confirmed?.some(p => p.user === user?._id) 
                      ? '✅ Vais jogar!' 
                      : '⚠️ Confirma a tua presença!'}
                  </p>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Os Meus Grupos */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Os Meus Grupos</h2>
            <Link to="/groups" className="text-primary text-sm font-medium">
              Ver todos
            </Link>
          </div>
          
          {groups.length > 0 ? (
            <div className="space-y-3">
              {groups.map(group => (
                <Link key={group._id} to={`/chat/${group._id}`}>
                  <div className="bg-white rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                        <IoFootball className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{group.name}</h3>
                        <p className="text-sm text-gray-500">
                          {group.members?.length || 0} membros
                        </p>
                      </div>
                    </div>
                    <HiChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 text-center">
              <p className="text-gray-500">Ainda não estás em nenhum grupo</p>
            </div>
          )}
        </section>

        {/* Próximos Jogos */}
        {games.length > 1 && (
          <section>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Próximos Jogos</h2>
              <Link to="/games" className="text-primary text-sm font-medium">
                Ver todos
              </Link>
            </div>
            <div className="space-y-3">
              {games.slice(1).map(game => (
                <GameCard key={game._id} game={game} />
              ))}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section className="pb-8">
          <div className="grid grid-cols-2 gap-3">
            <button className="bg-white rounded-xl p-4 text-center hover:shadow-md transition-shadow">
              <IoFootball className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Criar Jogo</p>
            </button>
            <button className="bg-white rounded-xl p-4 text-center hover:shadow-md transition-shadow">
              <IoPeople className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Convidar Amigos</p>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default HomePage;