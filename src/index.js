require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');

// Verifica as variáveis de ambiente
let envCheck;
try {
  envCheck = require('./scripts/check-env').checkEnv();
  if (!envCheck.critical) {
    console.warn('⚠️ Atenção: Variáveis de ambiente críticas ausentes:', envCheck.missingVars);
  }
} catch (error) {
  console.warn('⚠️ Não foi possível verificar variáveis de ambiente:', error.message);
}

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Inicializa o Express
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Permite requisições do frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Rota principal
app.get('/', (req, res) => {
  res.json({ message: 'Bem-vindo à API de Autenticação do BluePay!' });
});

// Rota de health check melhorada
app.get('/health', (req, res) => {
  res.json({ 
    service: 'auth-api',
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.1',
    env: envCheck?.env || {
      nodeEnv: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_KEY,
      hasJwtSecret: !!process.env.JWT_SECRET
    }
  });
});

// Rotas de diagnóstico para depuração no Vercel
app.get('/debug', (req, res) => {
  res.json({
    nodeVersion: process.version,
    platform: process.platform,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      // Não expõe os valores reais, apenas se estão definidos
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_KEY: !!process.env.SUPABASE_KEY,
      JWT_SECRET: !!process.env.JWT_SECRET,
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
      FRONTEND_URL: process.env.FRONTEND_URL,
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
    error: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno'
  });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de autenticação rodando na porta ${PORT}`);
  console.log('Ambiente:', process.env.NODE_ENV || 'development');
});

// Para serverless
module.exports = app; 