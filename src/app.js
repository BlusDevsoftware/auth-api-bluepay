const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const colaboradoresRoutes = require('./routes/colaboradores.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/colaboradores', colaboradoresRoutes);

// Rota de teste
app.get('/api/test', (req, res) => {
    res.json({ message: 'API está funcionando!' });
});

module.exports = app; 