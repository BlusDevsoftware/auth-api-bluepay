require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

try {
  // Verifica se as variáveis de ambiente necessárias estão definidas
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error('Variáveis de ambiente SUPABASE_URL e SUPABASE_KEY são obrigatórias');
  }

  // Cria o cliente do Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY,
    {
      auth: {
        persistSession: false // Desativa persistência de sessão para ambiente serverless
      }
    }
  );

  module.exports = supabase;
} catch (error) {
  console.error('Erro ao configurar Supabase:', error);
  // Cria um cliente mock para evitar falhas
  const mockClient = {
    from: () => ({ 
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: 'Supabase não configurado corretamente' }),
      update: () => Promise.resolve({ data: null, error: 'Supabase não configurado corretamente' }),
      delete: () => Promise.resolve({ data: null, error: 'Supabase não configurado corretamente' })
    }),
    auth: {
      signIn: () => Promise.resolve({ user: null, error: 'Supabase não configurado corretamente' })
    }
  };
  
  module.exports = mockClient;
} 