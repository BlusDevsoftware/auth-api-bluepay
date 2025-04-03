const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth.middleware');

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Listar todos os usuários
router.get('/', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('usuarios')
      .select('id, email, papel, status, created_at, updated_at');

    if (error) throw error;

    res.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ message: 'Erro ao listar usuários' });
  }
});

// Buscar usuário por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabase
      .from('usuarios')
      .select('id, email, papel, status, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ message: 'Erro ao buscar usuário' });
  }
});

// Criar novo usuário
router.post('/', async (req, res) => {
  try {
    const { nome, email, senha, papel, status, observacoes } = req.body;

    // Verifica se o email já está em uso
    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Hash da senha
    const senha_hash = await bcrypt.hash(senha, 10);

    // Cria o usuário
    const userData = {
      nome,
      email,
      senha_hash,
      papel: papel || 'user',
      status: status || 'ativo',
      observacoes
    };

    // Tenta inserir usando os nomes de campos em português
    let { data: newUser, error } = await supabase
      .from('usuarios')
      .insert([userData])
      .select()
      .single();

    if (error && error.code === 'PGRST116') {
      // Erro pode ser devido a nomes de campos incorretos, tenta com nomes em inglês
      console.log('Tentando novamente com nomes de campos em inglês...');
      
      const englishData = {
        name: nome,
        email: email,
        password_hash: senha_hash,
        role: papel || 'user',
        status: status || 'active',
        notes: observacoes
      };
      
      const result = await supabase
        .from('usuarios')
        .insert([englishData])
        .select()
        .single();
        
      newUser = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Erro ao criar usuário - Detalhes:', {
        erro: error,
        codigo: error.code,
        mensagem: error.message,
        detalhe: error.details,
        tabela: 'usuarios'
      });
      return res.status(400).json({ message: 'Erro ao criar usuário' });
    }

    // Remove a senha do objeto de retorno
    delete newUser.senha_hash;

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ message: 'Erro ao criar usuário' });
  }
});

// Atualizar usuário
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, senha, papel, status, observacoes } = req.body;

    const updateData = {
      email,
      papel,
      status,
      observacoes,
      updated_at: new Date()
    };

    // Se uma nova senha foi fornecida, faz o hash
    if (senha) {
      updateData.senha_hash = await bcrypt.hash(senha, 10);
    }

    const { data: updatedUser, error } = await supabase
      .from('usuarios')
      .update(updateData)
      .eq('id', id)
      .select('id, email, papel, status, created_at, updated_at')
      .single();

    if (error) {
      console.error('Erro ao atualizar usuário:', error);
      return res.status(400).json({ message: 'Erro ao atualizar usuário' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro ao atualizar usuário' });
  }
});

// Deletar usuário
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar usuário:', error);
      return res.status(400).json({ message: 'Erro ao deletar usuário' });
    }

    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ message: 'Erro ao deletar usuário' });
  }
});

module.exports = router; 