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
    const { data: servicos, error } = await supabase
      .from('servicos')
      .select('*')
      .order('codigo');

    if (error) throw error;

    res.json(servicos);
  } catch (error) {
    console.error('Erro ao listar serviços:', error);
    res.status(500).json({ message: 'Erro ao listar serviços' });
  }
});

// Buscar serviço por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: servico, error } = await supabase
      .from('servicos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }

    res.json(servico);
  } catch (error) {
    console.error('Erro ao buscar serviço:', error);
    res.status(500).json({ message: 'Erro ao buscar serviço' });
  }
});

// Criar novo serviço
router.post('/', async (req, res) => {
  try {
    const { codigo, nome, categoria, valor, duracao, descricao, status } = req.body;

    // Verifica se o código já está em uso
    const { data: existingServico } = await supabase
      .from('servicos')
      .select('*')
      .eq('codigo', codigo)
      .single();

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

    const { data: newServico, error } = await supabase
      .from('servicos')
      .insert([servicoData])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar serviço:', error);
      return res.status(400).json({ message: 'Erro ao criar serviço' });
    }

    res.status(201).json(newServico);
  } catch (error) {
    console.error('Erro ao criar serviço:', error);
    res.status(500).json({ message: 'Erro ao criar serviço' });
  }
});

// Atualizar serviço
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, nome, categoria, valor, duracao, descricao, status } = req.body;

    // Verifica se o código já está em uso por outro serviço
    const { data: existingServico } = await supabase
      .from('servicos')
      .select('*')
      .eq('codigo', codigo)
      .neq('id', id)
      .single();

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

    const { data: updatedServico, error } = await supabase
      .from('servicos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar serviço:', error);
      return res.status(400).json({ message: 'Erro ao atualizar serviço' });
    }

    res.json(updatedServico);
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    res.status(500).json({ message: 'Erro ao atualizar serviço' });
  }
});

// Deletar serviço
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('servicos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar serviço:', error);
      return res.status(400).json({ message: 'Erro ao deletar serviço' });
    }

    res.json({ message: 'Serviço deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar serviço:', error);
    res.status(500).json({ message: 'Erro ao deletar serviço' });
  }
});

module.exports = router; 