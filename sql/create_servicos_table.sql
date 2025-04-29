-- Criação da tabela de serviços
CREATE TABLE IF NOT EXISTS servicos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    categoria VARCHAR(50),
    valor DECIMAL(10,2) NOT NULL,
    duracao VARCHAR(20),
    descricao TEXT,
    status VARCHAR(20) DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_servicos_codigo ON servicos(codigo);
CREATE INDEX IF NOT EXISTS idx_servicos_status ON servicos(status);

-- Comentários
COMMENT ON TABLE servicos IS 'Tabela de serviços do sistema';
COMMENT ON COLUMN servicos.id IS 'Identificador único do serviço';
COMMENT ON COLUMN servicos.codigo IS 'Código único do serviço';
COMMENT ON COLUMN servicos.nome IS 'Nome do serviço';
COMMENT ON COLUMN servicos.categoria IS 'Categoria do serviço';
COMMENT ON COLUMN servicos.valor IS 'Valor do serviço';
COMMENT ON COLUMN servicos.duracao IS 'Duração estimada do serviço';
COMMENT ON COLUMN servicos.descricao IS 'Descrição detalhada do serviço';
COMMENT ON COLUMN servicos.status IS 'Status do serviço (ativo/inativo)';
COMMENT ON COLUMN servicos.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN servicos.updated_at IS 'Data da última atualização do registro'; 