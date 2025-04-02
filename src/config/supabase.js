const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.CHAVE_SUPABASE;

console.log('Configurando Supabase...');
console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não configuradas');
  console.error('URL:', supabaseUrl);
  console.error('Key exists:', !!supabaseKey);
  throw new Error('Variáveis de ambiente do Supabase não configuradas');
}

try {
  console.log('Criando cliente Supabase...');
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Cliente Supabase criado com sucesso!');
  module.exports = supabase;
} catch (error) {
  console.error('Erro ao criar cliente Supabase:', error);
  throw error;
} 