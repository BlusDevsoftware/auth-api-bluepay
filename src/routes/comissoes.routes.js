const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth.middleware');

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Listar todas as comissões
router.get('/', async (req, res) => {
  try {
    const { status, colaborador_id, data_inicio, data_fim } = req.query;

    let query = supabase
      .from('comissoes')
      .select(`
        *,
        colaborador:colaboradores (
          id,
          nome,
          email
        )
      `);

    // Filtros
    if (status) {
      query = query.eq('status', status);
    }
    if (colaborador_id) {
      query = query.eq('colaborador_id', colaborador_id);
    }
    if (data_inicio) {
      query = query.gte('data_criacao', data_inicio);
    }
    if (data_fim) {
      query = query.lte('data_criacao', data_fim);
    }

    const { data: comissoes, error } = await query.order('data_criacao', { ascending: false });

    if (error) throw error;

    res.json(comissoes);
  } catch (error) {
    console.error('Erro ao listar comissões:', error);
    res.status(500).json({ message: 'Erro ao listar comissões' });
  }
});

// Buscar comissão por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: comissao, error } = await supabase
      .from('comissoes')
      .select(`
        *,
        colaborador:colaboradores (
          id,
          nome,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ message: 'Comissão não encontrada' });
    }

    res.json(comissao);
  } catch (error) {
    console.error('Erro ao buscar comissão:', error);
    res.status(500).json({ message: 'Erro ao buscar comissão' });
  }
});

// Criar comissão
router.post('/', async (req, res) => {
  try {
    const { 
      colaborador_id, 
      valor,
      tipo,
      data_venda,
      data_pagamento,
      observacoes
    } = req.body;

    // Busca o colaborador para verificar a taxa de comissão
    const { data: colaborador, error: colaboradorError } = await supabase
      .from('colaboradores')
      .select('taxa_comissao')
      .eq('id', colaborador_id)
      .single();

    if (colaboradorError || !colaborador) {
      return res.status(400).json({ message: 'Colaborador não encontrado' });
    }

    const { data: novaComissao, error } = await supabase
      .from('comissoes')
      .insert([
        {
          colaborador_id,
          valor,
          tipo,
          data_venda,
          data_pagamento,
          observacoes,
          status: 'pendente',
          criado_por: req.user.id
        }
      ])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: 'Erro ao criar comissão' });
    }

    res.status(201).json(novaComissao);
  } catch (error) {
    console.error('Erro ao criar comissão:', error);
    res.status(500).json({ message: 'Erro ao criar comissão' });
  }
});

// Atualizar comissão
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      valor,
      tipo,
      data_venda,
      data_pagamento,
      observacoes,
      status 
    } = req.body;

    const { data: comissaoAtualizada, error } = await supabase
      .from('comissoes')
      .update({
        valor,
        tipo,
        data_venda,
        data_pagamento,
        observacoes,
        status,
        data_atualizacao: new Date(),
        atualizado_por: req.user.id
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: 'Erro ao atualizar comissão' });
    }

    res.json(comissaoAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar comissão:', error);
    res.status(500).json({ message: 'Erro ao atualizar comissão' });
  }
});

// Dar baixa em uma comissão
router.post('/:id/pagamento', async (req, res) => {
  try {
    const { id } = req.params;
    const { valor_pago, data_pagamento, observacoes } = req.body;

    const { data: comissao, error: findError } = await supabase
      .from('comissoes')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !comissao) {
      return res.status(404).json({ message: 'Comissão não encontrada' });
    }

    if (comissao.status === 'pago') {
      return res.status(400).json({ message: 'Esta comissão já foi paga' });
    }

    const { data: comissaoAtualizada, error } = await supabase
      .from('comissoes')
      .update({
        valor_pago,
        data_pagamento,
        observacoes: observacoes ? `${comissao.observacoes || ''}\n${observacoes}` : comissao.observacoes,
        status: 'pago',
        data_atualizacao: new Date(),
        atualizado_por: req.user.id
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: 'Erro ao dar baixa na comissão' });
    }

    res.json(comissaoAtualizada);
  } catch (error) {
    console.error('Erro ao dar baixa na comissão:', error);
    res.status(500).json({ message: 'Erro ao dar baixa na comissão' });
  }
});

module.exports = router; 