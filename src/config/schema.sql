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
CREATE TABLE IF NOT EXISTS colaboradores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    departamento VARCHAR(50) NOT NULL,
    cargo VARCHAR(50) NOT NULL,
    data_admissao DATE NOT NULL,
    percentual_comissao DECIMAL(5,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ativo',
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_colaboradores_updated_at
    BEFORE UPDATE ON colaboradores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX idx_colaboradores_email ON colaboradores(email);
CREATE INDEX idx_colaboradores_departamento ON colaboradores(departamento);
CREATE INDEX idx_colaboradores_status ON colaboradores(status);
CREATE INDEX idx_colaboradores_cargo ON colaboradores(cargo); 