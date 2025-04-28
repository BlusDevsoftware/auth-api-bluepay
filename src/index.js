require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const colaboradoresRoutes = require('./routes/colaboradores.routes');
const clientesRoutes = require('./routes/clientes.routes');

// Inicializa o Express
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: [
    'https://system-blue-pay.vercel.app',
    'https://system-blue-8jaddh0cr-bluedevs-projects.vercel.app',
    'http://localhost:5500',
    'https://bluepay.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rota de healthcheck
app.get('/api', (req, res) => {
  res.json({ message: 'Bem-vindo à API de Autenticação do BluePay!' });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    env: {
      nodeEnv: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_KEY,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasJwtExpires: !!process.env.JWT_EXPIRES_IN,
      supabaseUrlLength: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.length : 0,
      supabaseKeyLength: process.env.SUPABASE_KEY ? process.env.SUPABASE_KEY.length : 0,
      supabaseUrlStartsWith: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 10) : '',
      supabaseKeyStartsWith: process.env.SUPABASE_KEY ? process.env.SUPABASE_KEY.substring(0, 10) : ''
    }
  });
});

// Usa as rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/colaboradores', colaboradoresRoutes);
app.use('/api/clientes', clientesRoutes);

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('Erro na aplicação:', err);
  res.status(500).json({ 
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Exporta o app para o ambiente serverless
module.exports = app; 