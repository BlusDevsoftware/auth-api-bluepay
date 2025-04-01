const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

// Verificação do JWT_SECRET ao inicializar o roteador
if (!process.env.JWT_SECRET) {
  console.error('ERRO CRÍTICO: JWT_SECRET não está definido!');
  // Continuamos mesmo com erro para não derrubar a aplicação, mas logamos o problema
}

// Login
router.post('/login', async (req, res) => {
  console.log('Tentativa de login recebida');
  
  try {
    const { email, password } = req.body;
    
    // Validação de entrada
    if (!email || !password) {
      console.log('Tentativa de login com credenciais incompletas');
      return res.status(400).json({ 
        success: false,
        message: 'Email e senha são obrigatórios' 
      });
    }

    console.log(`Buscando usuário com email: ${email}`);
    
    // Tenta primeiro com a tabela 'usuarios' (nome em português)
    let { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();
      
    // Se falhar, tenta com a tabela 'users' (nome em inglês)
    if (error || !user) {
      console.log('Usuário não encontrado na tabela "usuarios", tentando tabela "users"');
      ({ data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single());
    }

    if (error) {
      console.error('Erro ao buscar usuário:', error);
    }

    if (!user) {
      console.log(`Usuário com email ${email} não encontrado`);
      return res.status(401).json({ 
        success: false,
        message: 'Credenciais inválidas' 
      });
    }
    
    // Determina qual campo contém a senha hash
    const passwordField = user.senha_hash ? 'senha_hash' : 'password';
    const passwordHash = user[passwordField];
    
    if (!passwordHash) {
      console.error(`Campo de senha não encontrado para o usuário ${email}`);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro na configuração da conta' 
      });
    }

    // Verifica a senha
    console.log('Verificando senha...');
    const isValidPassword = await bcrypt.compare(password, passwordHash);
    
    if (!isValidPassword) {
      console.log(`Senha inválida para o usuário ${email}`);
      return res.status(401).json({ 
        success: false,
        message: 'Credenciais inválidas' 
      });
    }

    // Verifica se JWT_SECRET está definido
    if (!process.env.JWT_SECRET) {
      console.error('Falha ao gerar token: JWT_SECRET não definido');
      return res.status(500).json({ 
        success: false,
        message: 'Erro de configuração do servidor' 
      });
    }

    // Gera o token JWT
    console.log('Gerando token JWT...');
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Remove a senha do objeto do usuário
    delete user[passwordField];

    console.log(`Login bem-sucedido para ${email}`);
    res.json({
      success: true,
      user,
      token
    });
  } catch (error) {
    console.error('Erro no processo de login:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao fazer login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

// Adiciona uma rota de teste
router.get('/test', (req, res) => {
  res.json({
    message: 'Rotas de autenticação funcionando corretamente',
    timestamp: new Date().toISOString(),
    auth_config: {
      hasJwtSecret: !!process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h (padrão)',
    }
  });
});

module.exports = router; 