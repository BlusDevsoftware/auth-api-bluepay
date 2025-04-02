const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log('Configurando Supabase...');
console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseKey);
console.log('Key length:', supabaseKey ? supabaseKey.length : 0);
console.log('Key starts with:', supabaseKey ? supabaseKey.substring(0, 10) : '');

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não configuradas');
  console.error('URL:', supabaseUrl);
  console.error('Key exists:', !!supabaseKey);
  console.error('Key length:', supabaseKey ? supabaseKey.length : 0);
  console.error('Key starts with:', supabaseKey ? supabaseKey.substring(0, 10) : '');
  throw new Error('Variáveis de ambiente do Supabase não configuradas');
}

// Configuração do cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Testa a conexão
console.log('Testando conexão com Supabase...');
supabase.from('usuarios').select('count').limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error('Erro ao testar conexão:', error);
      console.error('Detalhes do erro:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('Conexão com Supabase estabelecida com sucesso!');
      console.log('Teste de contagem:', data);
    }
  })
  .catch(err => {
    console.error('Erro ao testar conexão:', err);
  });

module.exports = supabase; 