-- Recria a tabela usuarios
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  papel VARCHAR(50) NOT NULL DEFAULT 'usuario',
  status VARCHAR(50) NOT NULL DEFAULT 'ativo',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cria o usuário admin com senha: admin123
-- O hash foi gerado usando bcrypt com salt rounds = 10
INSERT INTO usuarios (email, senha, papel, status)
VALUES (
  'admin@bluepay.com',
  '$2a$10$fLeTFbmwlUtJoY/u9.MvTOnraEs5QQZ/yEnG4UboW0MtXnZ1xpHjq',
  'admin',
  'ativo'
)
ON CONFLICT (email) DO UPDATE SET
  senha = EXCLUDED.senha,
  papel = EXCLUDED.papel,
  status = EXCLUDED.status,
  atualizado_em = CURRENT_TIMESTAMP;

-- Cria uma função para atualizar o atualizado_em
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Cria um trigger para atualizar o atualizado_em automaticamente
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;

CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verifica se o usuário admin foi criado corretamente
SELECT 
  id,
  email,
  papel,
  status,
  criado_em,
  atualizado_em,
  CASE WHEN senha IS NOT NULL THEN '***' ELSE NULL END as senha
FROM usuarios 
WHERE email = 'admin@bluepay.com';

-- Tabela de Colaboradores
DROP TABLE IF EXISTS colaboradores;
CREATE TABLE colaboradores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefone VARCHAR(20),
    cargo VARCHAR(50) NOT NULL,
    data_admissao DATE NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para a tabela de colaboradores
CREATE INDEX idx_colaboradores_nome ON colaboradores(nome);
CREATE INDEX idx_colaboradores_email ON colaboradores(email);
CREATE INDEX idx_colaboradores_status ON colaboradores(status);

-- Tabela de Clientes
DROP TABLE IF EXISTS clientes;
CREATE TABLE clientes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    telefone VARCHAR(20),
    status VARCHAR(10) NOT NULL DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para a tabela de clientes
CREATE INDEX idx_clientes_codigo ON clientes(codigo);
CREATE INDEX idx_clientes_nome ON clientes(nome);
CREATE INDEX idx_clientes_status ON clientes(status);

-- Tabela de Produtos
DROP TABLE IF EXISTS produtos;
CREATE TABLE produtos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para a tabela de produtos
CREATE INDEX idx_produtos_codigo ON produtos(codigo);
CREATE INDEX idx_produtos_nome ON produtos(nome);
CREATE INDEX idx_produtos_status ON produtos(status);

-- Tabela de Serviços
DROP TABLE IF EXISTS servicos;
CREATE TABLE servicos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para a tabela de serviços
CREATE INDEX idx_servicos_codigo ON servicos(codigo);
CREATE INDEX idx_servicos_nome ON servicos(nome);
CREATE INDEX idx_servicos_status ON servicos(status);

-- Tabela de Usuários
DROP TABLE IF EXISTS usuarios;
CREATE TABLE usuarios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(100) NOT NULL,
    perfil VARCHAR(20) NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para a tabela de usuários
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_status ON usuarios(status); 