const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log('Configurando Supabase...');
console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não configuradas');
  console.error('URL:', supabaseUrl);
  console.error('Key exists:', !!supabaseKey);
  throw new Error('Variáveis de ambiente do Supabase não configuradas');
}

let supabase = null;

try {
  console.log('Criando cliente Supabase...');
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  console.log('Cliente Supabase criado com sucesso!');
} catch (error) {
  console.error('Erro ao criar cliente Supabase:', error);
  throw error;
}

module.exports = supabase; 