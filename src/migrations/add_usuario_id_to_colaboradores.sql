-- Adição da coluna usuario_id à tabela colaboradores
ALTER TABLE colaboradores ADD COLUMN usuario_id UUID NULL;

-- Adiciona uma chave estrangeira que referencia a tabela de usuários
ALTER TABLE colaboradores ADD CONSTRAINT fk_colaboradores_usuario 
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE SET NULL;

-- Adiciona um índice para melhorar a performance de consultas
CREATE INDEX idx_colaboradores_usuario_id ON colaboradores(usuario_id);

-- Garante que um usuario_id só pode estar associado a um colaborador
ALTER TABLE colaboradores ADD CONSTRAINT uq_colaboradores_usuario_id 
    UNIQUE (usuario_id); 