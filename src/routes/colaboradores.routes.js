const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Listar todos os colaboradores
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM colaboradores ORDER BY nome');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar colaboradores:', error);
        res.status(500).json({ message: 'Erro ao listar colaboradores' });
    }
});

// Buscar colaborador por ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM colaboradores WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Colaborador não encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar colaborador:', error);
        res.status(500).json({ message: 'Erro ao buscar colaborador' });
    }
});

// Criar novo colaborador
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            nome,
            email,
            telefone,
            departamento,
            cargo,
            data_admissao,
            percentual_comissao,
            status,
            observacoes
        } = req.body;

        // Validar campos obrigatórios
        if (!nome || !email || !telefone || !departamento || !cargo || !data_admissao || !percentual_comissao) {
            return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos' });
        }

        // Verificar se o email já existe
        const emailCheck = await pool.query('SELECT id FROM colaboradores WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Email já cadastrado' });
        }

        const result = await pool.query(
            `INSERT INTO colaboradores (
                nome, email, telefone, departamento, cargo, 
                data_admissao, percentual_comissao, status, observacoes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING *`,
            [nome, email, telefone, departamento, cargo, data_admissao, percentual_comissao, status, observacoes]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar colaborador:', error);
        res.status(500).json({ message: 'Erro ao criar colaborador' });
    }
});

// Atualizar colaborador
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nome,
            email,
            telefone,
            departamento,
            cargo,
            data_admissao,
            percentual_comissao,
            status,
            observacoes
        } = req.body;

        // Validar campos obrigatórios
        if (!nome || !email || !telefone || !departamento || !cargo || !data_admissao || !percentual_comissao) {
            return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos' });
        }

        // Verificar se o email já existe para outro colaborador
        const emailCheck = await pool.query(
            'SELECT id FROM colaboradores WHERE email = $1 AND id != $2',
            [email, id]
        );
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Email já cadastrado para outro colaborador' });
        }

        const result = await pool.query(
            `UPDATE colaboradores 
            SET nome = $1, email = $2, telefone = $3, departamento = $4, 
                cargo = $5, data_admissao = $6, percentual_comissao = $7, 
                status = $8, observacoes = $9
            WHERE id = $10 
            RETURNING *`,
            [nome, email, telefone, departamento, cargo, data_admissao, 
             percentual_comissao, status, observacoes, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Colaborador não encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar colaborador:', error);
        res.status(500).json({ message: 'Erro ao atualizar colaborador' });
    }
});

// Excluir colaborador
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM colaboradores WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Colaborador não encontrado' });
        }

        res.json({ message: 'Colaborador excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir colaborador:', error);
        res.status(500).json({ message: 'Erro ao excluir colaborador' });
    }
});

module.exports = router; 