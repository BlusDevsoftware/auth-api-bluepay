const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth.middleware');

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Validação de serviço
function validateServico(servico) {
    const errors = [];
    
    if (!servico.nome) {
        errors.push('Nome é obrigatório');
    }
    
    if (!servico.codigo) {
        errors.push('Código é obrigatório');
    }
    
    if (!servico.valor) {
        errors.push('Valor é obrigatório');
    }
    
    if (servico.status && !['ativo', 'inativo'].includes(servico.status)) {
        errors.push('Status inválido');
    }
    
    return errors;
}

// Listar todos os serviços
router.get('/', async (req, res) => {
    try {
        console.log('Iniciando listagem de serviços...');
        
        const { data, error } = await supabase
            .from('servicos')
            .select('*')
            .order('codigo');
            
        if (error) {
            console.error('Erro do Supabase:', error);
            throw error;
        }
        
        console.log('Serviços recuperados com sucesso:', data.length);
        res.json(data);
    } catch (error) {
        console.error('Erro detalhado ao listar serviços:', {
            message: error.message,
            code: error.code,
            details: error.details
        });
        
        res.status(500).json({
            message: 'Erro ao listar serviços',
            error: error.message,
            details: error.details || 'Sem detalhes adicionais'
        });
    }
});

// Buscar serviço por ID
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('servicos')
            .select('*')
            .eq('id', req.params.id)
            .single();
            
        if (error) throw error;
        
        if (!data) {
            return res.status(404).json({
                message: 'Serviço não encontrado'
            });
        }
        
        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar serviço:', error);
        res.status(500).json({
            message: 'Erro ao buscar serviço',
            error: error.message
        });
    }
});

// Criar novo serviço
router.post('/', async (req, res) => {
    try {
        const servico = {
            codigo: req.body.codigo,
            nome: req.body.nome,
            categoria: req.body.categoria || null,
            valor: req.body.valor,
            duracao: req.body.duracao || null,
            descricao: req.body.descricao || null,
            status: req.body.status || 'ativo'
        };
        
        const errors = validateServico(servico);
        if (errors.length > 0) {
            return res.status(400).json({
                message: 'Dados inválidos',
                errors
            });
        }
        
        // Verificar se já existe um serviço com o mesmo código
        const { data: existingServico, error: checkError } = await supabase
            .from('servicos')
            .select('id')
            .eq('codigo', servico.codigo)
            .single();
            
        if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
        }
        
        if (existingServico) {
            return res.status(400).json({
                message: 'Serviço já existe',
                details: 'Já existe um serviço com este código'
            });
        }
        
        // Inserir novo serviço
        const { data, error } = await supabase
            .from('servicos')
            .insert([servico])
            .select()
            .single();
            
        if (error) throw error;
        
        res.status(201).json(data);
    } catch (error) {
        console.error('Erro ao criar serviço:', error);
        res.status(500).json({
            message: 'Erro ao criar serviço',
            error: error.message
        });
    }
});

// Atualizar serviço
router.put('/:id', async (req, res) => {
    try {
        const servico = {
            codigo: req.body.codigo,
            nome: req.body.nome,
            categoria: req.body.categoria || null,
            valor: req.body.valor,
            duracao: req.body.duracao || null,
            descricao: req.body.descricao || null,
            status: req.body.status || 'ativo'
        };
        
        const errors = validateServico(servico);
        if (errors.length > 0) {
            return res.status(400).json({
                message: 'Dados inválidos',
                errors
            });
        }
        
        // Verificar se já existe outro serviço com o mesmo código
        const { data: existingServico, error: checkError } = await supabase
            .from('servicos')
            .select('id')
            .eq('codigo', servico.codigo)
            .neq('id', req.params.id)
            .single();
            
        if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
        }
        
        if (existingServico) {
            return res.status(400).json({
                message: 'Serviço já existe',
                details: 'Já existe outro serviço com este código'
            });
        }
        
        // Atualizar serviço
        const { data, error } = await supabase
            .from('servicos')
            .update(servico)
            .eq('id', req.params.id)
            .select()
            .single();
            
        if (error) throw error;
        
        if (!data) {
            return res.status(404).json({
                message: 'Serviço não encontrado'
            });
        }
        
        res.json(data);
    } catch (error) {
        console.error('Erro ao atualizar serviço:', error);
        res.status(500).json({
            message: 'Erro ao atualizar serviço',
            error: error.message
        });
    }
});

// Excluir serviço
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('servicos')
            .delete()
            .eq('id', req.params.id);
            
        if (error) throw error;
        
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao excluir serviço:', error);
        res.status(500).json({
            message: 'Erro ao excluir serviço',
            error: error.message
        });
    }
});

module.exports = router; 