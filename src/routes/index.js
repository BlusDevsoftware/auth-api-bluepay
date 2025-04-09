const express = require('express');
const router = express.Router();
const colaboradoresRoutes = require('./colaboradores.routes');
const clientesRoutes = require('./clientes.routes');
const produtosRoutes = require('./produtos.routes');
const servicosRoutes = require('./servicos.routes');
const usuariosRoutes = require('./usuarios.routes');

// Rotas
router.use('/colaboradores', colaboradoresRoutes);
router.use('/clientes', clientesRoutes);
router.use('/produtos', produtosRoutes);
router.use('/servicos', servicosRoutes);
router.use('/usuarios', usuariosRoutes);

module.exports = router; 