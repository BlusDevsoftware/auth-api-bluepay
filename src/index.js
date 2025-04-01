require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
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
    env: {
      nodeEnv: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_KEY,
      hasJwtSecret: !!process.env.JWT_SECRET
    }
  });
});

// Usa as rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Middleware de erro
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
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