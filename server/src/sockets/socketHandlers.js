const { Message, Group } = require('../models');

const setupSocketHandlers = (io) => {
  // Middleware para autenticar socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const { User } = require('../models');
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }
      
      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });
  
  io.on('connection', (socket) => {
    console.log('✅ User conectado:', socket.user.name);
    
    // Juntar-se aos grupos do user
    socket.on('join_groups', async () => {
      try {
        const { User } = require('../models');
        const user = await User.findById(socket.userId).populate('groups');
        
        for (const group of user.groups) {
          socket.join(group._id.toString());
          console.log(`${socket.user.name} juntou-se ao grupo ${group.name}`);
        }
        
        socket.emit('groups_joined', { 
          groups: user.groups.map(g => g._id) 
        });
      } catch (error) {
        socket.emit('error', { message: 'Erro ao juntar aos grupos' });
      }
    });
    
    // Juntar-se a um grupo específico
    socket.on('join_group', async (groupId) => {
      try {
        // Verificar se é membro
        const group = await Group.findById(groupId);
        const isMember = group?.members.some(
          m => m.user.toString() === socket.userId
        );
        
        if (!isMember) {
          return socket.emit('error', { message: 'Não és membro deste grupo' });
        }
        
        socket.join(groupId);
        console.log(`${socket.user.name} juntou-se ao grupo ${groupId}`);
        
        // Notificar outros membros
        socket.to(groupId).emit('user_online', {
          userId: socket.userId,
          userName: socket.user.name
        });
      } catch (error) {
        socket.emit('error', { message: 'Erro ao juntar ao grupo' });
      }
    });
    
    // Enviar mensagem
    socket.on('send_message', async (data) => {
      try {
        const { groupId, text, type = 'text' } = data;
        
        // Verificar se é membro do grupo
        const group = await Group.findById(groupId);
        const isMember = group?.members.some(
          m => m.user.toString() === socket.userId
        );
        
        if (!isMember) {
          return socket.emit('error', { message: 'Não és membro deste grupo' });
        }
        
        // Criar mensagem
        const message = await Message.create({
          group: groupId,
          sender: socket.userId,
          content: {
            text,
            type
          }
        });
        
        // Popular dados do sender
        await message.populate('sender', 'name avatar');
        
        // Emitir para todos no grupo (incluindo o sender)
        io.to(groupId).emit('new_message', {
          message: {
            _id: message._id,
            group: message.group,
            sender: message.sender,
            content: message.content,
            createdAt: message.createdAt
          }
        });
        
        // Atualizar última atividade do grupo
        group.lastActivity = new Date();
        await group.save();
        
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        socket.emit('error', { message: 'Erro ao enviar mensagem' });
      }
    });
    
    // Marcar mensagem como lida
    socket.on('mark_read', async (data) => {
      try {
        const { messageId } = data;
        
        const message = await Message.findById(messageId);
        if (message) {
          await message.markAsRead(socket.userId);
          
          // Notificar sender que a mensagem foi lida
          socket.to(message.group.toString()).emit('message_read', {
            messageId,
            userId: socket.userId
          });
        }
      } catch (error) {
        console.error('Erro ao marcar como lida:', error);
      }
    });
    
    // Typing indicator
    socket.on('typing_start', ({ groupId }) => {
      socket.to(groupId).emit('user_typing', {
        userId: socket.userId,
        userName: socket.user.name
      });
    });
    
    socket.on('typing_stop', ({ groupId }) => {
      socket.to(groupId).emit('user_stopped_typing', {
        userId: socket.userId
      });
    });
    
    // Reação a mensagem
    socket.on('add_reaction', async (data) => {
      try {
        const { messageId, emoji } = data;
        
        const message = await Message.findById(messageId);
        if (!message) {
          return socket.emit('error', { message: 'Mensagem não encontrada' });
        }
        
        await message.addReaction(socket.userId, emoji);
        
        // Emitir para todos no grupo
        io.to(message.group.toString()).emit('reaction_added', {
          messageId,
          userId: socket.userId,
          emoji
        });
      } catch (error) {
        socket.emit('error', { message: 'Erro ao adicionar reação' });
      }
    });
    
    // Sair de um grupo
    socket.on('leave_group', (groupId) => {
      socket.leave(groupId);
      socket.to(groupId).emit('user_offline', {
        userId: socket.userId
      });
    });
    
    // Disconnect
    socket.on('disconnect', () => {
      console.log('❌ User desconectado:', socket.user.name);
      
      // Notificar grupos que o user está offline
      socket.rooms.forEach(room => {
        if (room !== socket.id) {
          socket.to(room).emit('user_offline', {
            userId: socket.userId
          });
        }
      });
    });
  });
};

module.exports = { setupSocketHandlers };