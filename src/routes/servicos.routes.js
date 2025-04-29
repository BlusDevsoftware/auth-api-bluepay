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
    console.log('Iniciando busca de serviços...');
    console.log('Headers da requisição:', req.headers);

    const { data: servicos, error } = await supabase
      .from('servicos')
      .select('*')
      .order('codigo');

    if (error) {
      console.error('Erro ao buscar serviços no Supabase:', error);
      throw error;
    }

    console.log('Serviços encontrados:', servicos);
    res.json(servicos);
  } catch (error) {
    console.error('Erro ao listar serviços:', error);
    res.status(500).json({ 
      message: 'Erro ao listar serviços',
      error: error.message
    });
  }
});

// Buscar serviço por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Buscando serviço com ID: ${id}`);

    const { data: servico, error } = await supabase
      .from('servicos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar serviço no Supabase:', error);
      return res.status(404).json({ 
        message: 'Serviço não encontrado',
        error: error.message
      });
    }

    res.json(servico);
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
    const { codigo, nome, categoria, valor, duracao, descricao, status } = req.body;
    console.log('Dados recebidos para criar serviço:', req.body);

    // Verifica se o código já está em uso
    const { data: existingServico, error: checkError } = await supabase
      .from('servicos')
      .select('*')
      .eq('codigo', codigo)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Erro ao verificar código existente:', checkError);
      throw checkError;
    }

    if (existingServico) {
      return res.status(400).json({ message: 'Código já cadastrado' });
    }

    // Cria o serviço
    const servicoData = {
      codigo,
      nome,
      categoria,
      valor,
      duracao,
      descricao,
      status: status || 'ativo'
    };

    const { data: newServico, error: createError } = await supabase
      .from('servicos')
      .insert([servicoData])
      .select()
      .single();

    if (createError) {
      console.error('Erro ao criar serviço no Supabase:', createError);
      throw createError;
    }

    res.status(201).json(newServico);
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
    const { id } = req.params;
    const { codigo, nome, categoria, valor, duracao, descricao, status } = req.body;
    console.log(`Atualizando serviço com ID: ${id}`, req.body);

    // Verifica se o código já está em uso por outro serviço
    const { data: existingServico, error: checkError } = await supabase
      .from('servicos')
      .select('*')
      .eq('codigo', codigo)
      .neq('id', id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Erro ao verificar código existente:', checkError);
      throw checkError;
    }

    if (existingServico) {
      return res.status(400).json({ message: 'Código já cadastrado' });
    }

    const updateData = {
      codigo,
      nome,
      categoria,
      valor,
      duracao,
      descricao,
      status,
      updated_at: new Date()
    };

    const { data: updatedServico, error: updateError } = await supabase
      .from('servicos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar serviço no Supabase:', updateError);
      throw updateError;
    }

    res.json(updatedServico);
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    res.status(500).json({ 
      message: 'Erro ao atualizar serviço',
      error: error.message
    });
  }
});

// Deletar serviço
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Deletando serviço com ID: ${id}`);

    const { error } = await supabase
      .from('servicos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar serviço no Supabase:', error);
      throw error;
    }

    res.json({ message: 'Serviço deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar serviço:', error);
    res.status(500).json({ 
      message: 'Erro ao deletar serviço',
      error: error.message
    });
  }
});

module.exports = router; 