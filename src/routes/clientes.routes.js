const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabaseClient');

// Listar todos os clientes
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .order('nome');
            
        if (error) throw error;
        
        res.json(data || []);
    } catch (error) {
        console.error('Erro ao listar clientes:', error);
        res.status(500).json({
            message: 'Erro ao listar clientes',
            error: error.message
        });
    }
});

// Buscar cliente por ID
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('id', req.params.id)
            .single();
            
        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    message: 'Cliente não encontrado'
                });
            }
            throw error;
        }
        
        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar cliente:', error);
        res.status(500).json({
            message: 'Erro ao buscar cliente',
            error: error.message
        });
    }
});

// Criar novo cliente
router.post('/', async (req, res) => {
    try {
        const cliente = {
            codigo_crm: req.body.codigo_crm,
            nome: req.body.nome,
            email: req.body.email || null,
            telefone: req.body.telefone || null,
            status: req.body.status || 'ativo'
        };
        
        // Validações básicas
        if (!cliente.nome) {
            return res.status(400).json({
                message: 'Nome é obrigatório'
            });
        }
        
        // Verificar se já existe um cliente com o mesmo código CRM
        if (cliente.codigo_crm) {
            const { data: existingCliente, error: checkError } = await supabase
                .from('clientes')
                .select('id')
                .eq('codigo_crm', cliente.codigo_crm)
                .single();
                
            if (checkError && checkError.code !== 'PGRST116') {
                throw checkError;
            }
            
            if (existingCliente) {
                return res.status(400).json({
                    message: 'Cliente já existe',
                    details: 'Já existe um cliente com este código CRM'
                });
            }
        }
        
        // Inserir novo cliente
        const { data, error } = await supabase
            .from('clientes')
            .insert([cliente])
            .select()
            .single();
            
        if (error) throw error;
        
        res.status(201).json(data);
    } catch (error) {
        console.error('Erro ao criar cliente:', error);
        res.status(500).json({
            message: 'Erro ao criar cliente',
            error: error.message
        });
    }
});

// Atualizar cliente
router.put('/:id', async (req, res) => {
    try {
        const cliente = {
            codigo_crm: req.body.codigo_crm,
            nome: req.body.nome,
            email: req.body.email || null,
            telefone: req.body.telefone || null,
            status: req.body.status
        };
        
        // Validações básicas
        if (!cliente.nome) {
            return res.status(400).json({
                message: 'Nome é obrigatório'
            });
        }
        
        // Verificar se o cliente existe
        const { data: existingCliente, error: checkError } = await supabase
            .from('clientes')
            .select('id')
            .eq('id', req.params.id)
            .single();
            
        if (checkError) {
            if (checkError.code === 'PGRST116') {
                return res.status(404).json({
                    message: 'Cliente não encontrado'
                });
            }
            throw checkError;
        }
        
        // Verificar se já existe outro cliente com o mesmo código CRM
        if (cliente.codigo_crm) {
            const { data: crmCheck, error: crmError } = await supabase
                .from('clientes')
                .select('id')
                .eq('codigo_crm', cliente.codigo_crm)
                .neq('id', req.params.id)
                .single();
                
            if (crmError && crmError.code !== 'PGRST116') {
                throw crmError;
            }
            
            if (crmCheck) {
                return res.status(400).json({
                    message: 'Código CRM já existe',
                    details: 'Já existe outro cliente com este código CRM'
                });
            }
        }
        
        // Atualizar cliente
        const { data, error } = await supabase
            .from('clientes')
            .update(cliente)
            .eq('id', req.params.id)
            .select()
            .single();
            
        if (error) throw error;
        
        res.json(data);
    } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        res.status(500).json({
            message: 'Erro ao atualizar cliente',
            error: error.message
        });
    }
});

// Excluir cliente
router.delete('/:id', async (req, res) => {
    try {
        // Verificar se o cliente existe
        const { data: existingCliente, error: checkError } = await supabase
            .from('clientes')
            .select('id')
            .eq('id', req.params.id)
            .single();
            
        if (checkError) {
            if (checkError.code === 'PGRST116') {
                return res.status(404).json({
                    message: 'Cliente não encontrado'
                });
            }
            throw checkError;
        }
        
        // Excluir cliente
        const { error } = await supabase
            .from('clientes')
            .delete()
            .eq('id', req.params.id);
            
        if (error) throw error;
        
        res.json({ message: 'Cliente excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        res.status(500).json({
            message: 'Erro ao excluir cliente',
            error: error.message
        });
    }
});

module.exports = router; 