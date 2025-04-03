const express = require('express');
const router = express.Router();
const axios = require('axios');
const ApiConfig = require('../config/api-config');
const authMiddleware = require('../middleware/auth.middleware');

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Listar todos os colaboradores
router.get('/', async (req, res) => {
    try {
        const response = await axios.get(ApiConfig.endpoints.colaboradores.list, {
            headers: {
                Authorization: req.headers.authorization
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Erro ao listar colaboradores:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ 
            message: 'Erro ao listar colaboradores',
            error: error.response?.data || error.message
        });
    }
});

// Buscar colaborador por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.get(ApiConfig.endpoints.colaboradores.get(id), {
            headers: {
                Authorization: req.headers.authorization
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Erro ao buscar colaborador:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ 
            message: 'Erro ao buscar colaborador',
            error: error.response?.data || error.message
        });
    }
});

// Criar novo colaborador
router.post('/', async (req, res) => {
    try {
        const response = await axios.post(ApiConfig.endpoints.colaboradores.create, req.body, {
            headers: {
                Authorization: req.headers.authorization,
                'Content-Type': 'application/json'
            }
        });
        res.status(201).json(response.data);
    } catch (error) {
        console.error('Erro ao criar colaborador:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ 
            message: 'Erro ao criar colaborador',
            error: error.response?.data || error.message
        });
    }
});

// Atualizar colaborador
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.put(ApiConfig.endpoints.colaboradores.update(id), req.body, {
            headers: {
                Authorization: req.headers.authorization,
                'Content-Type': 'application/json'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Erro ao atualizar colaborador:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ 
            message: 'Erro ao atualizar colaborador',
            error: error.response?.data || error.message
        });
    }
});

// Deletar colaborador
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.delete(ApiConfig.endpoints.colaboradores.delete(id), {
            headers: {
                Authorization: req.headers.authorization
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Erro ao deletar colaborador:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ 
            message: 'Erro ao deletar colaborador',
            error: error.response?.data || error.message
        });
    }
});

module.exports = router; 