require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authMiddleware = require('./middleware/auth.middleware');
const usersRoutes = require('./routes/users.routes');
const servicosRoutes = require('./routes/servicos.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const colaboradoresRoutes = require('./routes/colaboradores.routes');
const clientesRoutes = require('./routes/clientes.routes');

// Inicializa o Express
const app = express();

// Configuração do CORS - deve vir antes de qualquer outro middleware
const corsOptions = {
  origin: ['https://system-blue-pay.vercel.app', 'https://system-blue-2muagxayq-bluedevs-projects.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400, // 24 horas em segundos
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Habilita o CORS para todas as rotas
app.use(cors(corsOptions));

// Middleware para tratar preflight requests
app.options('*', cors(corsOptions));

// Middleware manual de CORS para garantir os headers em todas as respostas
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (corsOptions.origin.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', corsOptions.methods.join(','));
  res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(','));
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Middleware para processar JSON
app.use(express.json());

// Rotas públicas
app.use('/api/auth', authRoutes);
app.use('/api/public', userRoutes);

// Middleware de autenticação para rotas protegidas
const protectedRouter = express.Router();
protectedRouter.use(authMiddleware);

// Rotas protegidas
protectedRouter.use('/users', usersRoutes);
protectedRouter.use('/servicos', servicosRoutes);
protectedRouter.use('/colaboradores', colaboradoresRoutes);
protectedRouter.use('/clientes', clientesRoutes);

// Adiciona o router protegido à aplicação
app.use('/api', protectedRouter);

// Rota de teste para verificar se a API está funcionando
app.get('/api/public/test', (req, res) => {
  res.json({ 
    message: 'Rota pública funcionando!',
    cors: 'Se você está vendo esta mensagem, o CORS está configurado corretamente.',
    timestamp: new Date().toISOString()
  });
});

// Rota de healthcheck
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'production',
    cors: {
      origins: corsOptions.origin,
      methods: corsOptions.methods.join(',')
    }
  });
});

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

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Exporta o app para o ambiente serverless
module.exports = app; 