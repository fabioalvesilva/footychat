import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IoFootball, IoPeople, IoChevronForward } from 'react-icons/io5';
import Header from '../components/common/Header';
import api from '../services/api';

function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups');
      setGroups(res.data.groups);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Os Meus Grupos" showNotifications />

      <main className="px-4 py-4">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">A carregar grupos...</p>
          </div>
        ) : groups.length > 0 ? (
          <div className="space-y-3">
            {groups.map(group => (
              <Link key={group._id} to={`/chat/${group._id}`}>
                <div className="bg-white rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="w-14 h-14 bg-gradient-to-br from-primary to-green-600 rounded-2xl flex items-center justify-center mr-4">
                        <IoFootball className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{group.name}</h3>
                        <div className="flex items-center mt-1">
                          <IoPeople className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-500">
                            {group.members?.length || 0} membros
                          </span>
                        </div>
                      </div>
                    </div>
                    <IoChevronForward className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 text-center">
            <IoFootball className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Ainda não estás em nenhum grupo</p>
            <p className="text-sm text-gray-400">Pede a um amigo para te adicionar!</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default GroupsPage;