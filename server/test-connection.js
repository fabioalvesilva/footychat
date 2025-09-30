const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔄 Tentando conectar ao MongoDB...');
    console.log('URI:', process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conexão bem sucedida!');
    
    // Testar criação de documento
    const TestSchema = new mongoose.Schema({ test: String });
    const Test = mongoose.model('Test', TestSchema);
    
    const doc = await Test.create({ test: 'FootyChat teste' });
    console.log('✅ Documento criado:', doc);
    
    // Limpar
    await Test.deleteMany({});
    console.log('✅ Teste completo!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

testConnection();