const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Tentativa de login:', { email });
    console.log('Verificando conexão com Supabase...');

    // Testa a conexão com o Supabase
    console.log('Testando conexão com Supabase...');
    const { data: testConnection, error: testError } = await supabase
      .from('usuarios')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('Erro na conexão com Supabase:', testError);
      console.error('Detalhes do erro:', {
        code: testError.code,
        message: testError.message,
        details: testError.details,
        hint: testError.hint
      });
      return res.status(500).json({ 
        message: 'Erro na conexão com o banco de dados',
        error: process.env.NODE_ENV === 'development' ? testError.message : undefined,
        details: process.env.NODE_ENV === 'development' ? {
          supabaseUrl: process.env.SUPABASE_URL,
          hasSupabaseKey: !!process.env.SUPABASE_KEY,
          tableName: 'usuarios'
        } : undefined
      });
    }

    console.log('Conexão com Supabase OK, contagem de usuários:', testConnection);

    // Verifica a estrutura da tabela
    console.log('Verificando estrutura da tabela...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('usuarios')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('Erro ao verificar estrutura da tabela:', tableError);
    } else if (tableInfo && tableInfo.length > 0) {
      console.log('Estrutura da tabela:', Object.keys(tableInfo[0]));
    }

    // Lista todos os usuários para debug
    console.log('Listando todos os usuários...');
    const { data: allUsers, error: listError } = await supabase
      .from('usuarios')
      .select('*');

    if (listError) {
      console.error('Erro ao listar usuários:', listError);
      console.error('Detalhes do erro:', {
        code: listError.code,
        message: listError.message,
        details: listError.details,
        hint: listError.hint
      });
    } else {
      console.log('Total de usuários:', allUsers.length);
      console.log('Usuários encontrados:', allUsers.map(u => ({ 
        id: u.id, 
        email: u.email, 
        papel: u.papel,
        status: u.status,
        created_at: u.created_at,
        updated_at: u.updated_at
      })));
    }

    // Verifica se o usuário existe
    console.log('Buscando usuário com email:', email);
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Erro ao buscar usuário:', error);
      console.error('Detalhes do erro:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        query: { email, table: 'usuarios' }
      });
      return res.status(500).json({ message: 'Erro ao buscar usuário' });
    }

    if (!user) {
      console.log('Usuário não encontrado:', email);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    console.log('Usuário encontrado:', { 
      id: user.id, 
      email: user.email, 
      papel: user.papel,
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at
    });

    // Verifica a senha
    console.log('Verificando senha...');
    console.log('Senha fornecida:', password);
    console.log('Hash da senha no banco:', user.senha);
    const isValidPassword = await bcrypt.compare(password, user.senha);
    console.log('Resultado da comparação:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('Senha inválida para o usuário:', email);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Gera o token JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Remove a senha do objeto do usuário
    delete user.senha;

    console.log('Login bem-sucedido para o usuário:', email);

    res.json({
      success: true,
      user,
      token
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao fazer login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Registro (não usado na interface atual, mas mantido para completude da API)
router.post('/register', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    // Verifica se o usuário já existe
    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Cria o usuário
    const { data: newUser, error } = await supabase
      .from('usuarios')
      .insert([
        {
          nome,
          email,
          senha: senhaHash,
          papel: 'user',
          status: 'ativo'
        }
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Remove a senha do objeto do usuário
    delete newUser.senha;

    // Gera o token JWT
    const token = jwt.sign(
      { userId: newUser.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      user: newUser,
      token
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ message: 'Erro ao registrar usuário' });
  }
});

// Verifica token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    // Remove a senha do objeto do usuário
    delete user.senha;

    res.json({ user });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Token inválido' });
    }
    res.status(500).json({ message: 'Erro ao verificar token' });
  }
});

// Rota temporária para listar todos os usuários (apenas para debug)
router.get('/debug/users', async (req, res) => {
  try {
    console.log('Listando todos os usuários...');
    const { data: users, error } = await supabase
      .from('usuarios')
      .select('*');

    if (error) {
      console.error('Erro ao listar usuários:', error);
      return res.status(500).json({ message: 'Erro ao listar usuários', error: error.message });
    }

    console.log('Total de usuários:', users.length);
    console.log('Usuários:', users);

    return res.json({
      total: users.length,
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        papel: u.papel,
        status: u.status,
        created_at: u.created_at,
        updated_at: u.updated_at
      }))
    });
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    return res.status(500).json({ message: 'Erro ao listar usuários', error: err.message });
  }
});

module.exports = router; 