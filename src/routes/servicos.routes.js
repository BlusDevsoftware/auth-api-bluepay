const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabaseClient');

// Listar todos os serviços
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('servicos')
            .select('*')
            .order('nome');

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Erro ao listar serviços:', error);
        res.status(500).json({ message: 'Erro ao listar serviços' });
    }
});

// Obter um serviço pelo ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('servicos')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        if (!data) {
            return res.status(404).json({ message: 'Serviço não encontrado' });
        }
        
        res.json(data);
    } catch (error) {
        console.error('Erro ao obter serviço:', error);
        res.status(500).json({ message: 'Erro ao obter serviço' });
    }
});

// Criar um novo serviço
router.post('/', async (req, res) => {
    try {
        const { codigo, nome, categoria, valor, duracao, status, descricao } = req.body;
        
        const { data, error } = await supabase
            .from('servicos')
            .insert([{ codigo, nome, categoria, valor, duracao, status, descricao }])
            .select()
            .single();
        
        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('Erro ao criar serviço:', error);
        res.status(500).json({ message: 'Erro ao criar serviço' });
    }
});

// Atualizar um serviço
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { codigo, nome, categoria, valor, duracao, status, descricao } = req.body;
        
        const { data, error } = await supabase
            .from('servicos')
            .update({ codigo, nome, categoria, valor, duracao, status, descricao })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        if (!data) {
            return res.status(404).json({ message: 'Serviço não encontrado' });
        }
        
        res.json(data);
    } catch (error) {
        console.error('Erro ao atualizar serviço:', error);
        res.status(500).json({ message: 'Erro ao atualizar serviço' });
    }
});

// Excluir um serviço
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('servicos')
            .delete()
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        if (!data) {
            return res.status(404).json({ message: 'Serviço não encontrado' });
        }
        
        res.json({ message: 'Serviço excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir serviço:', error);
        res.status(500).json({ message: 'Erro ao excluir serviço' });
    }
});

module.exports = router; 