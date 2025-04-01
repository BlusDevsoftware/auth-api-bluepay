const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verifica se o usuário existe
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Verifica a senha
    const isValidPassword = await bcrypt.compare(password, user.senha_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Gera o token JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Remove a senha do objeto do usuário
    delete user.senha_hash;

    res.json({
      user,
      token
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro ao fazer login' });
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
    const senha_hash = await bcrypt.hash(senha, 10);

    // Cria o usuário
    const { data: newUser, error } = await supabase
      .from('usuarios')
      .insert([
        {
          nome,
          email,
          senha_hash,
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
    delete newUser.senha_hash;

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
    delete user.senha_hash;

    res.json({ user });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Token inválido' });
    }
    res.status(500).json({ message: 'Erro ao verificar token' });
  }
});

module.exports = router; 