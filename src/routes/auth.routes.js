const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, senha, password } = req.body;
    const userPassword = senha || password;

    if (!email || !userPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    console.log('Tentativa de login:', { email });

    // Verifica se o usuário existe
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Erro ao buscar usuário:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Erro ao buscar usuário',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    if (!user) {
      console.log('Usuário não encontrado:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Credenciais inválidas' 
      });
    }

    // Verifica a senha
    const isValidPassword = await bcrypt.compare(userPassword, user.senha);
    
    if (!isValidPassword) {
      console.log('Senha inválida para o usuário:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Credenciais inválidas' 
      });
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
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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