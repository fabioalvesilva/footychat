// scripts/seed.js - VERSÃO COM DEBUG COMPLETO

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('🔍 Debug - Verificando configuração...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI existe?', !!process.env.MONGODB_URI);

// Mostrar parte da URI (escondendo password)
if (process.env.MONGODB_URI) {
  const uriParts = process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  console.log('URI (masked):', uriParts);
}

// Verificar se os models existem
try {
  console.log('\n📁 Verificando models...');
  
  const modelsPath = path.join(__dirname, '../src/models');
  console.log('Caminho dos models:', modelsPath);
  
  const User = require('../src/models/User');
  console.log('✅ User model carregado');
  
  const Group = require('../src/models/Group');
  console.log('✅ Group model carregado');
  
  const Field = require('../src/models/Field');
  console.log('✅ Field model carregado');
  
  const Game = require('../src/models/Game');
  console.log('✅ Game model carregado');
  
  const Message = require('../src/models/Message');
  console.log('✅ Message model carregado');
  
  const Notification = require('../src/models/Notification');
  console.log('✅ Notification model carregado');
  
} catch (error) {
  console.error('❌ Erro ao carregar models:', error.message);
  console.error('Certifica-te que todos os models estão em src/models/');
  process.exit(1);
}

const seedDatabase = async () => {
  try {
    // Verificar se temos URI
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI não está definido no .env');
    }
    
    console.log('\n🔄 Tentando conectar ao MongoDB...');
    
    // Conectar com opções explícitas
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout de 5 segundos
    });
    
    console.log('✅ Conectado ao MongoDB com sucesso!');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    
    // Importar models depois da conexão
    const User = require('../src/models/User');
    const Group = require('../src/models/Group');
    const Field = require('../src/models/Field');
    const Game = require('../src/models/Game');
    const Message = require('../src/models/Message');
    const Notification = require('../src/models/Notification');
    
    console.log('\n🗑️  Limpando base de dados...');
    
    // Limpar coleções
    const deleteResults = await Promise.all([
      User.deleteMany({}),
      Group.deleteMany({}),
      Field.deleteMany({}),
      Game.deleteMany({}),
      Message.deleteMany({}),
      Notification.deleteMany({})
    ]);
    
    console.log('Documentos removidos:');
    console.log('  - Users:', deleteResults[0].deletedCount);
    console.log('  - Groups:', deleteResults[1].deletedCount);
    console.log('  - Fields:', deleteResults[2].deletedCount);
    console.log('  - Games:', deleteResults[3].deletedCount);
    console.log('  - Messages:', deleteResults[4].deletedCount);
    console.log('  - Notifications:', deleteResults[5].deletedCount);
    
    console.log('\n👤 Criando utilizadores...');
    
    // Criar users de teste
    const users = [];
    
    const user1 = await User.create({
      name: 'João Admin',
      phoneNumber: '+351912345678',
      email: 'joao@test.com',
      password: 'password123',
      isVerified: true
    });
    users.push(user1);
    console.log('  ✅ User 1 criado:', user1.name, '- ID:', user1._id);
    
    const user2 = await User.create({
      name: 'Pedro Silva',
      phoneNumber: '+351923456789',
      email: 'pedro@test.com',
      password: 'password123',
      isVerified: true
    });
    users.push(user2);
    console.log('  ✅ User 2 criado:', user2.name, '- ID:', user2._id);
    
    const user3 = await User.create({
      name: 'Miguel Costa',
      phoneNumber: '+351934567890',
      email: 'miguel@test.com',
      password: 'password123',
      isVerified: true
    });
    users.push(user3);
    console.log('  ✅ User 3 criado:', user3.name, '- ID:', user3._id);
    
    console.log('\n⚽ Criando campo...');
    
    // Criar campo com estrutura mínima para MVP
    const field = await Field.create({
      name: 'Campo Municipal do Porto',
      description: 'Excelente campo sintético com balneários',
      location: {
        address: 'Rua do Desporto, 123',
        city: 'Porto',
        postalCode: '4000-123',
        coordinates: [-8.6291, 41.1579]
      },
      contacts: {
        phone: '+351220000000',
        email: 'campo@porto.pt'
      },
      amenities: {
        type: 'synthetic',
        sizes: [{ 
          name: '7v7', 
          quantity: 2 
        }],
        lighting: { 
          available: true 
        },
        parking: { 
          available: true, 
          free: true 
        },
        changingRooms: { 
          available: true, 
          quantity: 4, 
          showers: true 
        }
      },
      pricing: [{
        size: '7v7',
        currency: 'EUR',
        periods: [{
          name: 'Normal',
          hourlyRate: 40,
          timeSlots: [{
            dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
            startTime: '09:00',
            endTime: '23:00'
          }]
        }]
      }],
      availability: {
        schedule: [
          { dayOfWeek: 0, openTime: '09:00', closeTime: '23:00' },
          { dayOfWeek: 1, openTime: '09:00', closeTime: '23:00' },
          { dayOfWeek: 2, openTime: '09:00', closeTime: '23:00' },
          { dayOfWeek: 3, openTime: '09:00', closeTime: '23:00' },
          { dayOfWeek: 4, openTime: '09:00', closeTime: '23:00' },
          { dayOfWeek: 5, openTime: '09:00', closeTime: '23:00' },
          { dayOfWeek: 6, openTime: '09:00', closeTime: '23:00' }
        ]
      },
      management: {
        admin: users[0]._id
      },
      verification: {
        isVerified: true
      },
      rating: {
        average: 0,
        count: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      }
    });
    
    console.log('  ✅ Campo criado:', field.name, '- ID:', field._id);
    
    console.log('\n👥 Criando grupo...');
    
    // Criar grupo
    const group = await Group.create({
      name: 'Futebol às Quintas',
      description: 'Racha semanal todas as quintas às 20h',
      members: [
        { user: users[0]._id, role: 'admin' },
        { user: users[1]._id, role: 'member' },
        { user: users[2]._id, role: 'member' }
      ],
      settings: {
        maxMembers: 20,
        defaultField: field._id
      },
      createdBy: users[0]._id
    });
    
    console.log('  ✅ Grupo criado:', group.name, '- ID:', group._id);
    
    // Adicionar grupo aos users
    console.log('\n🔄 Atualizando utilizadores com o grupo...');
    for (const user of users) {
      await User.findByIdAndUpdate(user._id, {
        $push: { groups: group._id }
      });
      console.log(`  ✅ Grupo adicionado ao user ${user.name}`);
    }
    
    console.log('\n🎮 Criando jogo...');
    
    // Criar jogo para amanhã
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(20, 0, 0, 0);
    
    const game = await Game.create({
      group: group._id,
      field: field._id,
      dateTime: tomorrow,
      duration: 90,
      status: 'scheduled',
      players: {
        min: 10,
        max: 14,
        confirmed: [
          { user: users[0]._id },
          { user: users[1]._id }
        ],
        pending: [],
        declined: []
      },
      cost: {
        fieldPrice: 60,
        perPlayer: 6
      },
      createdBy: users[0]._id
    });
    
    console.log('  ✅ Jogo criado para:', tomorrow.toLocaleString('pt-PT'));
    console.log('  📍 ID do Jogo:', game._id);
    
    // Criar algumas mensagens de teste
    console.log('\n💬 Criando mensagens de teste...');
    
    const message1 = await Message.create({
      group: group._id,
      sender: users[0]._id,
      content: {
        text: 'Boas! Criei o grupo para os nossos jogos semanais.',
        type: 'text'
      }
    });
    console.log('  ✅ Mensagem 1 criada');
    
    const message2 = await Message.create({
      group: group._id,
      sender: users[1]._id,
      content: {
        text: 'Top! Já confirmei presença para amanhã.',
        type: 'text'
      }
    });
    console.log('  ✅ Mensagem 2 criada');
    
    // Criar notificação de teste
    console.log('\n🔔 Criando notificação de teste...');
    
    const notification = await Notification.create({
      recipient: users[2]._id,
      type: 'game_invitation',
      title: 'Novo Jogo Agendado!',
      message: `Jogo marcado para ${tomorrow.toLocaleDateString('pt-PT')} às 20:00. Confirma a tua presença!`,
      data: {
        game: game._id,
        group: group._id
      },
      actions: [
        { type: 'confirm', label: 'Confirmar' },
        { type: 'decline', label: 'Não Posso' }
      ]
    });
    console.log('  ✅ Notificação criada para', users[2].name);
    
    // Verificar dados criados
    console.log('\n📊 Verificando dados criados...');
    const counts = await Promise.all([
      User.countDocuments(),
      Group.countDocuments(),
      Field.countDocuments(),
      Game.countDocuments(),
      Message.countDocuments(),
      Notification.countDocuments()
    ]);
    
    console.log('Total de documentos na BD:');
    console.log('  - Users:', counts[0]);
    console.log('  - Groups:', counts[1]);
    console.log('  - Fields:', counts[2]);
    console.log('  - Games:', counts[3]);
    console.log('  - Messages:', counts[4]);
    console.log('  - Notifications:', counts[5]);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SEED CONCLUÍDO COM SUCESSO!');
    console.log('='.repeat(60));
    
    console.log('\n📱 DADOS DE TESTE PARA LOGIN:\n');
    console.log('User 1 (Admin do grupo):');
    console.log('  Phone: +351912345678');
    console.log('  Email: joao@test.com');
    console.log('  Pass:  password123\n');
    
    console.log('User 2:');
    console.log('  Phone: +351923456789');
    console.log('  Email: pedro@test.com');
    console.log('  Pass:  password123\n');
    
    console.log('User 3:');
    console.log('  Phone: +351934567890');
    console.log('  Email: miguel@test.com');
    console.log('  Pass:  password123');
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 IDs IMPORTANTES PARA TESTES:');
    console.log('='.repeat(60));
    console.log(`GROUP_ID: ${group._id}`);
    console.log(`FIELD_ID: ${field._id}`);
    console.log(`GAME_ID:  ${game._id}`);
    console.log(`USER1_ID: ${users[0]._id}`);
    console.log('='.repeat(60));
    
    console.log('\n✅ Podes agora iniciar o servidor com: npm run dev');
    
  } catch (error) {
    console.error('\n❌ ERRO NO SEED:', error.message);
    
    if (error.message.includes('MONGODB_URI')) {
      console.error('\n📝 Verifica o ficheiro .env:');
      console.error('   - Está na pasta server/?');
      console.error('   - Tem a linha MONGODB_URI=... ?');
      console.error('   - A connection string está correta?');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('\n📝 MongoDB não está acessível:');
      console.error('   - Se é local: O MongoDB está a correr?');
      console.error('   - Se é Atlas: Connection string correta?');
    } else if (error.message.includes('authentication failed')) {
      console.error('\n📝 Erro de autenticação:');
      console.error('   - Username e password corretos no Atlas?');
      console.error('   - Password não tem caracteres especiais?');
    } else if (error.message.includes('buffering timed out')) {
      console.error('\n📝 Timeout na conexão:');
      console.error('   - Verifica a connection string');
      console.error('   - No Atlas: IP está na whitelist?');
    } else if (error.name === 'ValidationError') {
      console.error('\n📝 Erro de validação nos dados:');
      console.error(error.errors);
    }
    
    console.error('\nStack trace completo:');
    console.error(error.stack);
    
  } finally {
    // Desconectar sempre
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n📤 Desconectado do MongoDB');
    }
    process.exit(0);
  }
};

// Executar seed
console.log('🚀 Iniciando seed...\n');
seedDatabase();

// Timeout de segurança (30 segundos)
setTimeout(() => {
  console.error('\n⏱️ Timeout! O seed está a demorar muito...');
  console.error('Possíveis causas:');
  console.error('- Connection string incorreta');
  console.error('- MongoDB Atlas: IP não está na whitelist');
  console.error('- Problemas de rede\n');
  process.exit(1);
}, 30000);