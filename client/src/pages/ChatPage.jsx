import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IoSend, IoArrowBack } from 'react-icons/io5';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { getSocket } from '../services/socket';
import api from '../services/api';

function ChatPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [group, setGroup] = useState(null);
  const messagesEndRef = useRef(null);
  const socket = getSocket();

  useEffect(() => {
    fetchGroup();
    fetchMessages();
    
    // Join group room
    if (socket) {
      socket.emit('join_group', groupId);
      
      // Listen for new messages
      socket.on('new_message', (data) => {
        if (data.message.group === groupId) {
          setMessages(prev => [...prev, data.message]);
        }
      });
    }

    return () => {
      if (socket) {
        socket.emit('leave_group', groupId);
        socket.off('new_message');
      }
    };
  }, [groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchGroup = async () => {
    try {
      const res = await api.get(`/groups/${groupId}`);
      setGroup(res.data.group);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      // Por agora vamos simular mensagens
      // Quando implementar o endpoint de mensagens, descomentar:
      // const res = await api.get(`/messages?groupId=${groupId}`);
      // setMessages(res.data.messages);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    socket.emit('send_message', {
      groupId,
      text: newMessage
    });

    setNewMessage('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="mr-3 p-2 -ml-2 rounded-full hover:bg-gray-100"
        >
          <IoArrowBack className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold text-gray-900">{group?.name}</h1>
          <p className="text-xs text-gray-500">
            {group?.members?.length} membros
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((message, index) => {
          const isOwnMessage = message.sender._id === user?._id || message.sender === user?._id;
          
          return (
            <div
              key={message._id || index}
              className={`mb-4 flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : ''}`}>
                {!isOwnMessage && (
                  <p className="text-xs text-gray-500 mb-1 ml-2">
                    {message.sender.name}
                  </p>
                )}
                <div className={`rounded-2xl px-4 py-2 ${
                  isOwnMessage 
                    ? 'bg-primary text-white' 
                    : 'bg-white border border-gray-200'
                }`}>
                  <p className="text-sm">{message.content?.text}</p>
                </div>
                <p className="text-xs text-gray-400 mt-1 mx-2">
                  {format(new Date(message.createdAt || new Date()), 'HH:mm')}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escrever mensagem..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="p-2 bg-primary text-white rounded-full hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IoSend className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;