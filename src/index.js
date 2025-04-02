const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');

// Inicializa o Express
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*', // Em produção, substituir pelo domínio do frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Rota de healthcheck
app.get('/', (req, res) => {
  res.json({ message: 'Bem-vindo à API de Autenticação do BluePay!' });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date(),
    version: process.env.npm_package_version || '1.0.0',
    env: {
      nodeEnv: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.CHAVE_SUPABASE,
      hasJwtSecret: !!process.env.JWT_SEGREDO,
      hasJwtExpires: !!process.env.JWT_EXPIRA_EM
    }
  });
});

// Usa as rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('Erro na aplicação:', err);
  res.status(500).json({ 
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log('Ambiente:', process.env.NODE_ENV);
  console.log('Variáveis de ambiente:');
  console.log('- SUPABASE_URL:', !!process.env.SUPABASE_URL);
  console.log('- CHAVE_SUPABASE:', !!process.env.CHAVE_SUPABASE);
  console.log('- JWT_SEGREDO:', !!process.env.JWT_SEGREDO);
  console.log('- JWT_EXPIRA_EM:', !!process.env.JWT_EXPIRA_EM);
}); 