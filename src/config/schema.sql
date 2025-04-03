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
  '$2a$10$N7RbF0Nk0k4kPFqXEXfzKuAhwXULtJHW8QqYq5jXoFHmqRYBGaEOO',
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