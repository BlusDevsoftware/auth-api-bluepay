const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabaseClient');
const authMiddleware = require('../middleware/auth.middleware');

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Validação de colaborador
function validateColaborador(colaborador) {
    const errors = [];
    
    if (!colaborador.nome) {
        errors.push('Nome é obrigatório');
    }
    
    if (!colaborador.email) {
        errors.push('Email é obrigatório');
    }
    
    if (!colaborador.telefone) {
        errors.push('Telefone é obrigatório');
    }
    
    if (!colaborador.cargo) {
        errors.push('Cargo é obrigatório');
    }
    
    if (!colaborador.data_admissao) {
        errors.push('Data de admissão é obrigatória');
    }
    
    if (!colaborador.status || !['ativo', 'inativo'].includes(colaborador.status)) {
        errors.push('Status inválido');
    }
    
    return errors;
}

// Listar todos os colaboradores
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('colaboradores')
            .select('*')
            .order('nome');
            
        if (error) throw error;
        
        res.json(data);
    } catch (error) {
        console.error('Erro ao listar colaboradores:', error);
        res.status(500).json({
            message: 'Erro ao listar colaboradores',
            error: error.message
        });
    }
});

// Buscar colaborador por ID
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('colaboradores')
            .select('*')
            .eq('id', req.params.id)
            .single();
            
        if (error) throw error;
        
        if (!data) {
            return res.status(404).json({
                message: 'Colaborador não encontrado'
            });
        }
        
        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar colaborador:', error);
        res.status(500).json({
            message: 'Erro ao buscar colaborador',
            error: error.message
        });
    }
});

// Obter próximo código disponível
async function getNextCodigo() {
    try {
        // Buscar o último código cadastrado
        const { data, error } = await supabase
            .from('colaboradores')
            .select('codigo')
            .order('codigo', { ascending: false })
            .limit(1);

        if (error) throw error;

        // Se não houver registros, começar do 1
        if (!data || data.length === 0) {
            return '00001';
        }

        // Pegar o último código e incrementar
        const lastCodigo = parseInt(data[0].codigo);
        const nextCodigo = (lastCodigo + 1).toString().padStart(5, '0');
        return nextCodigo;
    } catch (error) {
        console.error('Erro ao gerar código:', error);
        throw error;
    }
}

// Criar novo colaborador
router.post('/', async (req, res) => {
    try {
        const colaborador = {
            nome: req.body.nome,
            email: req.body.email,
            telefone: req.body.telefone,
            cargo: req.body.cargo,
            data_admissao: req.body.data_admissao,
            status: req.body.status || 'ativo'
        };
        
        const errors = validateColaborador(colaborador);
        if (errors.length > 0) {
            return res.status(400).json({
                message: 'Dados inválidos',
                errors
            });
        }
        
        // Verificar se já existe um colaborador com o mesmo email
        const { data: existingColaborador, error: checkError } = await supabase
            .from('colaboradores')
            .select('id')
            .eq('email', colaborador.email)
            .single();
            
        if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
        }
        
        if (existingColaborador) {
            return res.status(400).json({
                message: 'Colaborador já existe',
                details: 'Já existe um colaborador com este email'
            });
        }
        
        // Inserir novo colaborador
        const { data, error } = await supabase
            .from('colaboradores')
            .insert([colaborador])
            .select()
            .single();
            
        if (error) throw error;
        
        res.status(201).json(data);
    } catch (error) {
        console.error('Erro ao criar colaborador:', error);
        res.status(500).json({
            message: 'Erro ao criar colaborador',
            error: error.message
        });
    }
});

// Atualizar colaborador
router.put('/:id', async (req, res) => {
    try {
        const colaborador = {
            nome: req.body.nome,
            email: req.body.email,
            telefone: req.body.telefone,
            cargo: req.body.cargo,
            data_admissao: req.body.data_admissao,
            status: req.body.status
        };
        
        const errors = validateColaborador(colaborador);
        if (errors.length > 0) {
            return res.status(400).json({
                message: 'Dados inválidos',
                errors
            });
        }
        
        // Verificar se o colaborador existe
        const { data: existingColaborador, error: checkError } = await supabase
            .from('colaboradores')
            .select('id')
            .eq('id', req.params.id)
            .single();
            
        if (checkError) {
            if (checkError.code === 'PGRST116') {
                return res.status(404).json({
                    message: 'Colaborador não encontrado'
                });
            }
            throw checkError;
        }
        
        // Verificar se já existe outro colaborador com o mesmo email
        const { data: emailCheck, error: emailError } = await supabase
            .from('colaboradores')
            .select('id')
            .eq('email', colaborador.email)
            .neq('id', req.params.id)
            .single();
            
        if (emailError && emailError.code !== 'PGRST116') {
            throw emailError;
        }
        
        if (emailCheck) {
            return res.status(400).json({
                message: 'Email já existe',
                details: 'Já existe outro colaborador com este email'
            });
        }
        
        // Atualizar colaborador
        const { data, error } = await supabase
            .from('colaboradores')
            .update(colaborador)
            .eq('id', req.params.id)
            .select()
            .single();
            
        if (error) throw error;
        
        res.json(data);
    } catch (error) {
        console.error('Erro ao atualizar colaborador:', error);
        res.status(500).json({
            message: 'Erro ao atualizar colaborador',
            error: error.message
        });
    }
});

// Excluir colaborador
router.delete('/:id', async (req, res) => {
    try {
        // Verificar se o colaborador existe
        const { data: existingColaborador, error: checkError } = await supabase
            .from('colaboradores')
            .select('id')
            .eq('id', req.params.id)
            .single();
            
        if (checkError) {
            if (checkError.code === 'PGRST116') {
                return res.status(404).json({
                    message: 'Colaborador não encontrado'
                });
            }
            throw checkError;
        }
        
        // Excluir colaborador
        const { error } = await supabase
            .from('colaboradores')
            .delete()
            .eq('id', req.params.id);
            
        if (error) throw error;
        
        res.json({ message: 'Colaborador excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir colaborador:', error);
        res.status(500).json({
            message: 'Erro ao excluir colaborador',
            error: error.message
        });
    }
});

module.exports = router; 