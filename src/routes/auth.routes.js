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
        criado_em: u.criado_em,
        atualizado_em: u.atualizado_em
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
      criado_em: user.criado_em,
      atualizado_em: user.atualizado_em,
      senha: user.senha ? '***' : undefined
    });

    // Verifica a senha
    console.log('Verificando senha...');
    console.log('Senha fornecida:', password);
    console.log('Hash da senha no banco:', user.senha ? '***' : undefined);
    console.log('Tipo da senha fornecida:', typeof password);
    console.log('Tipo da senha no banco:', typeof user.senha);
    console.log('Comprimento da senha fornecida:', password.length);
    console.log('Comprimento da senha no banco:', user.senha.length);
    console.log('Primeiros 10 caracteres da senha fornecida:', password.substring(0, 10));
    console.log('Primeiros 10 caracteres da senha no banco:', user.senha.substring(0, 10));
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

// Registro de usuários
router.post('/register', async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Validações básicas
    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios',
        missingFields: {
          email: !email,
          senha: !senha
        }
      });
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Email inválido'
      });
    }

    // Validação de senha
    if (senha.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'A senha deve ter no mínimo 6 caracteres'
      });
    }

    console.log('Tentativa de registro:', { email });

    // Verifica se o usuário já existe
    const { data: existingUser, error: checkError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 é o código para "não encontrado"
      console.error('Erro ao verificar usuário existente:', checkError);
      return res.status(500).json({ 
        success: false,
        message: 'Erro ao verificar usuário existente'
      });
    }

    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Email já cadastrado'
      });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Cria o usuário
    const { data: newUser, error: createError } = await supabase
      .from('usuarios')
      .insert([
        {
          email,
          senha: senhaHash,
          papel: 'user',
          status: 'ativo'
        }
      ])
      .select()
      .single();

    if (createError) {
      console.error('Erro ao criar usuário:', createError);
      return res.status(500).json({ 
        success: false,
        message: 'Erro ao criar usuário',
        error: process.env.NODE_ENV === 'development' ? createError.message : undefined
      });
    }

    // Remove a senha do objeto do usuário
    delete newUser.senha;

    // Gera o token JWT
    const token = jwt.sign(
      { userId: newUser.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    console.log('Usuário registrado com sucesso:', { email, id: newUser.id });

    res.status(201).json({
      success: true,
      user: newUser,
      token
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao registrar usuário',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
        criado_em: u.criado_em,
        atualizado_em: u.atualizado_em
      }))
    });
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    return res.status(500).json({ message: 'Erro ao listar usuários', error: err.message });
  }
});

// Rota temporária para verificar o usuário admin (apenas para debug)
router.get('/debug/admin', async (req, res) => {
  try {
    console.log('Verificando usuário admin...');
    const { data: admin, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', 'admin@bluepay.com')
      .single();

    if (error) {
      console.error('Erro ao buscar admin:', error);
      return res.status(500).json({ message: 'Erro ao buscar admin', error: error.message });
    }

    if (!admin) {
      return res.status(404).json({ message: 'Usuário admin não encontrado' });
    }

    // Gera um novo hash da senha 'admin123' para comparação
    const newHash = await bcrypt.hash('admin123', 10);
    console.log('Hash atual no banco:', admin.senha);
    console.log('Novo hash gerado:', newHash);

    return res.json({
      id: admin.id,
      email: admin.email,
      papel: admin.papel,
      status: admin.status,
      senha_length: admin.senha ? admin.senha.length : 0,
      senha_starts_with: admin.senha ? admin.senha.substring(0, 10) : null,
      criado_em: admin.criado_em,
      atualizado_em: admin.atualizado_em
    });
  } catch (err) {
    console.error('Erro ao verificar admin:', err);
    return res.status(500).json({ message: 'Erro ao verificar admin', error: err.message });
  }
});

// Rota temporária para atualizar a senha do admin (apenas para debug)
router.post('/debug/admin/update-password', async (req, res) => {
  try {
    console.log('Atualizando senha do admin...');
    
    // Gera o hash da senha
    const senhaHash = await bcrypt.hash('admin123', 10);
    console.log('Novo hash gerado:', senhaHash);

    // Atualiza a senha do admin
    const { data: admin, error } = await supabase
      .from('usuarios')
      .update({ senha: senhaHash })
      .eq('email', 'admin@bluepay.com')
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar senha:', error);
      return res.status(500).json({ message: 'Erro ao atualizar senha', error: error.message });
    }

    return res.json({
      message: 'Senha atualizada com sucesso',
      id: admin.id,
      email: admin.email,
      papel: admin.papel,
      status: admin.status,
      senha_length: admin.senha ? admin.senha.length : 0,
      senha_starts_with: admin.senha ? admin.senha.substring(0, 10) : null
    });
  } catch (err) {
    console.error('Erro ao atualizar senha:', err);
    return res.status(500).json({ message: 'Erro ao atualizar senha', error: err.message });
  }
});

module.exports = router; 