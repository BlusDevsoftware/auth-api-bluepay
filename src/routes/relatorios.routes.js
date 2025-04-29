const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth.middleware');

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Relatório de comissões por período
router.get('/comissoes-por-periodo', async (req, res) => {
  try {
    const { data_inicio, data_fim, colaborador_id, status } = req.query;

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

    // Filtros obrigatórios de data
    if (!data_inicio || !data_fim) {
      return res.status(400).json({ message: 'Período é obrigatório' });
    }

    query = query
      .gte('data_criacao', data_inicio)
      .lte('data_criacao', data_fim);

    // Filtros opcionais
    if (colaborador_id) {
      query = query.eq('colaborador_id', colaborador_id);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: comissoes, error } = await query.order('data_criacao', { ascending: false });

    if (error) throw error;

    // Cálculos do relatório
    const relatorio = {
      periodo: {
        inicio: data_inicio,
        fim: data_fim
      },
      total_comissoes: comissoes.length,
      valor_total: comissoes.reduce((sum, comm) => sum + (comm.valor || 0), 0),
      total_pago: comissoes.filter(c => c.status === 'pago').length,
      total_pendente: comissoes.filter(c => c.status === 'pendente').length,
      comissoes_por_tipo: {},
      comissoes_por_colaborador: {},
      comissoes: comissoes
    };

    // Agrupa por tipo
    comissoes.forEach(comm => {
      if (!relatorio.comissoes_por_tipo[comm.tipo]) {
        relatorio.comissoes_por_tipo[comm.tipo] = {
          quantidade: 0,
          valor_total: 0
        };
      }
      relatorio.comissoes_por_tipo[comm.tipo].quantidade++;
      relatorio.comissoes_por_tipo[comm.tipo].valor_total += comm.valor || 0;
    });

    // Agrupa por colaborador
    comissoes.forEach(comm => {
      const collabId = comm.colaborador?.id;
      if (!collabId) return;

      if (!relatorio.comissoes_por_colaborador[collabId]) {
        relatorio.comissoes_por_colaborador[collabId] = {
          nome: comm.colaborador.nome,
          quantidade: 0,
          valor_total: 0,
          pagos: 0,
          pendentes: 0
        };
      }
      relatorio.comissoes_por_colaborador[collabId].quantidade++;
      relatorio.comissoes_por_colaborador[collabId].valor_total += comm.valor || 0;
      if (comm.status === 'pago') {
        relatorio.comissoes_por_colaborador[collabId].pagos++;
      } else {
        relatorio.comissoes_por_colaborador[collabId].pendentes++;
      }
    });

    res.json(relatorio);
  } catch (error) {
    console.error('Erro ao gerar relatório de comissões:', error);
    res.status(500).json({ message: 'Erro ao gerar relatório de comissões' });
  }
});

// Top colaboradores
router.get('/top-colaboradores', async (req, res) => {
  try {
    const { data_inicio, data_fim, limite = 5 } = req.query;

    let query = supabase
      .from('comissoes')
      .select(`
        colaborador_id,
        valor,
        colaborador:colaboradores (
          id,
          nome,
          email
        )
      `);

    if (data_inicio && data_fim) {
      query = query
        .gte('data_criacao', data_inicio)
        .lte('data_criacao', data_fim);
    }

    const { data: comissoes, error } = await query;

    if (error) throw error;

    // Agrupa e calcula totais por colaborador
    const totaisPorColaborador = {};
    comissoes.forEach(comm => {
      const collabId = comm.colaborador?.id;
      if (!collabId) return;

      if (!totaisPorColaborador[collabId]) {
        totaisPorColaborador[collabId] = {
          id: collabId,
          nome: comm.colaborador.nome,
          email: comm.colaborador.email,
          valor_total: 0,
          total_comissoes: 0
        };
      }
      totaisPorColaborador[collabId].valor_total += comm.valor || 0;
      totaisPorColaborador[collabId].total_comissoes++;
    });

    // Converte para array e ordena
    const topColaboradores = Object.values(totaisPorColaborador)
      .sort((a, b) => b.valor_total - a.valor_total)
      .slice(0, limite);

    res.json({
      periodo: {
        inicio: data_inicio,
        fim: data_fim
      },
      top_colaboradores: topColaboradores
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de top colaboradores:', error);
    res.status(500).json({ message: 'Erro ao gerar relatório de top colaboradores' });
  }
});

// Evolução mensal
router.get('/evolucao-mensal', async (req, res) => {
  try {
    const { ano, colaborador_id } = req.query;

    if (!ano) {
      return res.status(400).json({ message: 'Ano é obrigatório' });
    }

    let query = supabase
      .from('comissoes')
      .select('*')
      .gte('data_criacao', `${ano}-01-01`)
      .lte('data_criacao', `${ano}-12-31`);

    if (colaborador_id) {
      query = query.eq('colaborador_id', colaborador_id);
    }

    const { data: comissoes, error } = await query;

    if (error) throw error;

    // Inicializa array com 12 meses
    const dadosMensais = Array(12).fill(0).map((_, index) => ({
      mes: index + 1,
      valor_total: 0,
      quantidade: 0,
      valor_pago: 0,
      quantidade_paga: 0
    }));

    // Agrupa dados por mês
    comissoes.forEach(comm => {
      const mes = new Date(comm.data_criacao).getMonth();
      dadosMensais[mes].valor_total += comm.valor || 0;
      dadosMensais[mes].quantidade++;
      if (comm.status === 'pago') {
        dadosMensais[mes].valor_pago += comm.valor || 0;
        dadosMensais[mes].quantidade_paga++;
      }
    });

    res.json({
      ano,
      dados_mensais: dadosMensais
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de evolução mensal:', error);
    res.status(500).json({ message: 'Erro ao gerar relatório de evolução mensal' });
  }
});

module.exports = router; 