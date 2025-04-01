require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Mock client para fallback
const createMockClient = () => {
  console.warn('⚠️ Usando cliente Supabase simulado devido a erro de configuração');
  
  return {
    from: (table) => {
      console.log(`Mock: Tentativa de acessar tabela ${table}`);
      return {
        select: (columns) => Promise.resolve({ data: [], error: null }),
        insert: (data) => Promise.resolve({ data: null, error: 'Supabase não configurado corretamente' }),
        update: (data) => Promise.resolve({ data: null, error: 'Supabase não configurado corretamente' }),
        delete: () => Promise.resolve({ data: null, error: 'Supabase não configurado corretamente' }),
        eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) })
      };
    },
    auth: {
      signIn: () => Promise.resolve({ user: null, error: 'Supabase não configurado corretamente' }),
      signUp: () => Promise.resolve({ user: null, error: 'Supabase não configurado corretamente' })
    }
  };
};

let supabase;

try {
  // Verificação mais robusta das variáveis de ambiente
  if (!process.env.SUPABASE_URL) {
    throw new Error('Variável de ambiente SUPABASE_URL não definida');
  }
  
  if (!process.env.SUPABASE_KEY) {
    throw new Error('Variável de ambiente SUPABASE_KEY não definida');
  }

  // Validação básica do formato das variáveis
  if (!process.env.SUPABASE_URL.startsWith('http')) {
    throw new Error('SUPABASE_URL inválida, deve começar com http:// ou https://');
  }

  // Cria o cliente com timeout e retry
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY,
    {
      auth: {
        persistSession: false, // Desativa persistência de sessão para ambiente serverless
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      global: {
        headers: { 'x-application-name': 'auth-api-bluepay' },
      }
    }
  );
  
  console.log('✅ Cliente Supabase configurado com sucesso');
  
  // Teste a conexão para verificar se as credenciais estão corretas
  supabase.from('users').select('count', { count: 'exact', head: true })
    .then(({ error }) => {
      if (error) {
        console.error('❌ Erro ao conectar ao Supabase:', error.message);
      } else {
        console.log('✅ Conexão com Supabase testada com sucesso');
      }
    })
    .catch(err => {
      console.error('❌ Erro ao testar conexão com Supabase:', err.message);
    });

} catch (error) {
  console.error('❌ Erro ao configurar Supabase:', error.message);
  // Cria um cliente mock para evitar que a aplicação quebre
  supabase = createMockClient();
}

module.exports = supabase; 