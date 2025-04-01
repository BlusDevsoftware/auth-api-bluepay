require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Verifica se as variáveis de ambiente necessárias estão definidas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  throw new Error('Variáveis de ambiente SUPABASE_URL e SUPABASE_KEY são obrigatórias');
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